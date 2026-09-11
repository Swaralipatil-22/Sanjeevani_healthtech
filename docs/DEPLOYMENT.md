# Deployment

Three pieces: a PostgreSQL database, the API container, and the Next.js
console. All three have free-tier options.

Target topology:

```
Vercel (console)  ──►  Render / Railway (API)  ──►  Neon / Render (PostgreSQL)
```

---

## 1. Database

### Neon (recommended — no card required, instant)

1. Create a project at neon.tech.
2. Copy the connection details from the dashboard.
3. Keep them for step 2. **`DB_SSL` must be `true`.**

### Render PostgreSQL

If you use the `render.yaml` blueprint in step 2, Render provisions the
database and wires the credentials in automatically — skip ahead.

---

## 2. API — Render

### Option A: the blueprint (provisions database + API together)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, select the repo. It reads `render.yaml`.
3. Render creates `sanjeevani-postgres` and `sanjeevani-patient-service`, and
   generates the JWT and AES secrets itself.
4. Set the two values marked `sync: false`:
   - `SEED_DEFAULT_PASSWORD` — the password for the seeded demo accounts
   - `ALLOWED_ORIGINS` — leave blank for now; fill it in after step 3

### Option B: manual

**New → Web Service**, connect the repo, then:

| Setting | Value |
|---|---|
| Root directory | `sanjeevani-patient-service` |
| Runtime | Docker |
| Dockerfile path | `./Dockerfile` |
| Health check path | `/patient-service/health-check` |

Environment variables:

```
NODE_ENV=production
PORT=8000
SERVICE_BASE_PATH=/patient-service
ALLOWED_HOSTNAMES=*
ALLOWED_ORIGINS=https://<your-console>.vercel.app

DB_HOST=<host>
DB_PORT=5432
DB_NAME=<database>
DB_USERNAME=<user>
DB_PASSWORD=<password>
DB_SSL=true
DB_SYNC=true
DB_SEED=true

JWT_SECRET_KEY=<long random string>
AES_ENCRYPTION_KEY=<long random string>
AES_ENCRYPTION_IV=<long random string>
SEED_DEFAULT_PASSWORD=<demo account password>
```

Generate the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Confirm the deploy:

```bash
curl https://<your-api>.onrender.com/patient-service/health-check
# {"success":true,...,"data":{"status":"HEALTHY","dependencies":{"database":"UP"}}}
```

The first boot creates the schema and seeds demo data, so it takes a little
longer than later ones.

> **Free-tier note.** Render idles a free service after inactivity, so the
> first request can take 30–60 seconds. Worth mentioning to a reviewer before
> they think the app is broken.

### Railway instead of Render

Railway works the same way: new project → deploy from repo → set the root
directory to `sanjeevani-patient-service`, add a PostgreSQL plugin, and copy
its variables across. Railway does not idle free services.

---

## 3. Console — Vercel

1. **Add New → Project**, import the repository.
2. Set **Root Directory** to `sanjeevani-console`. Framework detection
   (Next.js) and the build command are correct by default.
3. Add one environment variable:

```
PATIENT_SERVICE_INTERNAL_ENDPOINT=https://<your-api>.onrender.com
```

No trailing slash. This is read at build and request time by
`next.config.ts`, which rewrites `/proxy/patient-service/*` onto it.

4. Deploy.

---

## 4. Close the CORS loop

Go back to the API service and set:

```
ALLOWED_ORIGINS=https://<your-console>.vercel.app
```

Then redeploy the API.

This is the step that most commonly gets missed. Without it, login fails with
a CORS error in the browser console while the API itself looks perfectly
healthy.

---

## 5. Verify

1. Open the Vercel URL. You should land on the login page.
2. Sign in as `doctor@sanjeevani.health` with your `SEED_DEFAULT_PASSWORD`.
3. Check that the encounter list is populated.
4. Sign out, sign in as `admin@sanjeevani.health`, and confirm the dashboard
   renders with charts.
5. Confirm the doctor account does **not** see the dashboard in its sidebar.

---

## Running the whole stack in Docker

With Docker Desktop healthy:

```bash
docker compose up --build
```

Brings up PostgreSQL, the API on `:8000` and the console on `:3000`.

For just the database while developing locally:

```bash
docker compose up -d postgres
```

### If Docker Desktop will not start

A `500 Internal Server Error` from `docker info` usually means the WSL backend
is wedged. In an **Administrator** PowerShell:

```powershell
wsl --shutdown
```

Then quit Docker Desktop from the system tray and reopen it. If that fails,
use a cloud database instead — nothing in local development requires Docker.

---

## Environment variable reference

### API (`sanjeevani-patient-service`)

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `PORT` | `8000` | |
| `SERVICE_BASE_PATH` | `/patient-service` | Path prefix for all routes |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allow-list |
| `ALLOWED_HOSTNAMES` | `localhost,127.0.0.1` | `*` behind a managed platform |
| `DB_HOST` … `DB_PASSWORD` | — | Connection settings |
| `DB_SSL` | `false` | **`true`** for every hosted database |
| `DB_SYNC` | `true` | Create/alter schema at boot |
| `DB_SEED` | `true` | Seed master data and demo records |
| `JWT_SECRET_KEY` | dev value | **Must** be replaced in production |
| `AES_ENCRYPTION_KEY` / `_IV` | dev values | **Must** be replaced |
| `JWT_EXPIRY_IN_SECONDS` | `10800` | 3 hours |
| `BCRYPT_SALT_ROUNDS` | `10` | |
| `LOG_LEVEL` | `info` | |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | Per window per token |
| `SEED_DEFAULT_PASSWORD` | `Sanjeevani@123` | Demo account password |

### Console (`sanjeevani-console`)

| Variable | Default | Notes |
|---|---|---|
| `PATIENT_SERVICE_INTERNAL_ENDPOINT` | `http://localhost:8000` | API origin, no trailing slash |

---

## Production hardening checklist

Before this served real patients, rather than a demo:

- [ ] `DB_SEED=false` and `DB_SYNC=false`; move to versioned migrations
- [ ] Replace every generated secret, and rotate on a schedule
- [ ] Remove the demo credentials panel from the login page
- [ ] Force a password change on first sign-in
- [ ] Narrow `ALLOWED_HOSTNAMES` from `*` to the real hostname
- [ ] Add refresh-token rotation so sessions do not expire mid-consultation
- [ ] Ship logs to a retained store — the audit trail is only as good as its
      durability
- [ ] Back up the database, and rehearse a restore
