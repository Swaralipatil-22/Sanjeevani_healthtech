  # Self-assessment

> A draft written to the brief's prompt — architecture choices, trade-offs, UX
> decisions, edge cases handled, and potential improvements. Please read it
> through and put it in your own words before submitting; the reviewer will
> ask about anything in here.

---

## What I set out to build

The brief describes a dashboard for rural telemedicine outreach: real-time
clinical data entry, role-based access, and trend visualisation for
administrators. Reading it, the part that struck me as the real design problem
was not the CRUD or the charts — it was that three roles need genuinely
different views of the same data, and that the data is medical.

So I treated two things as the spine of the system and let everything else
follow from them: **what each role can see**, and **what the database is
allowed to know about a person**.

## Architecture choices

### Two services, not one

I split the API from the console rather than using Next.js route handlers for
everything. It costs a little more setup, and it buys a clean statement of
where the security boundary is: the console is a rendering layer that can be
replaced, and every rule that matters lives behind one HTTP interface. It also
made the architecture diagram honest — there is a real boundary to draw.

### The browser never holds the token

The default pattern is a JWT in `localStorage` and an axios interceptor. That
loses the token to any successful XSS.

Instead, login is a server action that writes the token to an httpOnly,
`sameSite=strict` cookie, and `proxy.ts` attaches the bearer header
server-side as requests pass through `/proxy/*`. Client JavaScript never sees
the token at any point.

The trade-off is one extra network hop and a slightly more complicated mental
model for anyone reading the code for the first time. I think it is clearly
worth it for health data, and I would make the same call again.

### `READ_OWNED` as a permission, not a special case

The obvious way to implement "nurses see only their own records" is an `if
(role === NURSE)` in the controllers. That works until the fourth role.

Instead, ownership is a property of the permission: a route accepts
`READ_ALL` *or* `READ_OWNED`, the guard records which one the caller actually
holds, and the controller adds an ownership predicate when it is only the
latter. Adding a scoped role later is a seeding change, not a code change.

Two details I am glad I got right:

- The predicate goes **inside** the query, not after it — so pagination
  counts, exports and aggregates are all correct for the caller's scope.
- An out-of-scope lookup returns **404, not 403**. A 403 confirms the record
  exists, and for clinical data that is itself a disclosure.

### Pseudonymisation over encryption

I considered encrypting patient names at rest. Then I asked what the system
actually needs a name for, and the answer was nothing — every analytics output
is an aggregate, and clinicians work from a code on a card.

So the patients table has no name, phone number, address or government
identifier. Not encrypted: absent. A full database compromise yields no way to
identify a person.

This is a real trade-off, not a free win. A clinician cannot search for a
patient by name, and if a patient loses their card, re-identification is a
manual process at the facility. For this use case I think the privacy
guarantee is worth that friction, and it is the decision I would most want to
discuss with a real clinical team before shipping.

### Raw SQL only where the ORM is a poor fit

Everything goes through a typed repository layer except the six dashboard
aggregates, which use `COUNT(*) FILTER (WHERE …)` and `DATE_TRUNC` — awkward
through Sequelize and much clearer written out. All values are bound as
replacements; the one interpolated value, `granularity`, is allow-listed by
the request schema before it reaches the query.

### One query builder per resource

While studying the codebase I modelled this on, I noticed a documented
recurring bug: filter logic duplicated between `list` and `export`, and the two
drifting apart. So both call the same `buildEncounterWhere` /
`buildPatientWhere`. A filter fix cannot land in one and miss the other.

## UX decisions

**The sidebar changes shape per role.** Rather than greying out inaccessible
areas, categories with no permitted items are removed entirely. A nurse's
console is a nurse's console, not a doctor's with parts crossed out. Signing in
as the three demo accounts in turn is the fastest way to see the access model.

**Encounter entry is a three-step stepper, not one long form.** Point-of-care
entry happens between patients, often on a phone. Visit → clinical → review
keeps each screen short, and the final review step exists because a clinician
should see what they are committing before they commit it.

**Symptoms are chips with quick-add suggestions.** Free text would have been
faster to build but unusable for analytics. Chips keep the data structured
while staying quicker to enter than a dropdown.

**Severity is encoded twice, everywhere.** A coloured dot *and* the written
word. No clinical meaning depends on colour perception, which also means the
tables stay readable when printed.

**The dashboard says what it is not.** There is a line at the bottom stating
that every figure is an aggregate and no identifiers are stored. Administrators
should not have to infer the privacy model from the absence of a column.

**Chart colour is computed rather than chosen.** Three palettes for three jobs:
one brand teal for single-series magnitude, a fixed eight-slot categorical
palette for diagnosis identity, and a reserved status palette for acuity. I
validated the categorical palette for colour-vision-deficiency separation
against both the light and dark card surfaces (worst adjacent CVD ΔE 9.1 light,
8.4 dark). Three light-mode slots fall below 3:1 contrast against white, which
is exactly why that chart carries direct value labels rather than relying on
the bars alone.

## Edge cases handled

The brief called out four. All are covered, plus others I hit while building:

| Case | Behaviour |
|---|---|
| Session expires mid-entry | The cookie is set to expire a minute *before* the JWT, so the UI never sends a token the API is about to reject. A 401 routes through logout, clearing stale state rather than leaving a half-authenticated shell. |
| Invalid or incomplete encounter | Yup validates on both sides. Rejected: future dates, empty symptoms, out-of-range vitals, systolic ≤ diastolic, follow-up before the visit. |
| Role access violation | 403 with a stable error code, the attempt written to the audit trail, and the UI swaps the page for a 403 panel without changing the URL. |
| Deleting a patient with history | 409 — clinical history is never orphaned. |
| Disabled account with a live token | Account status is re-read on every request, not trusted from the JWT claim. |
| A nurse filing under a doctor's name | `clinician_id` is taken from the token and stripped from the payload. |
| Sorting by a private column | Sort fields are allow-listed; anything else falls back to the default. |
| A client requesting the whole table | Page size is capped at 1000 server-side. |
| Devanagari input | Name validation accepts Devanagari — outreach staff record complaints in Marathi as often as English. |
| Audit write failure | Logged, never propagated. An audit failure must not fail the clinical operation that triggered it. |
| Patient code collision | Generation retries rather than locking, which is adequate at clinic write volumes. |
| Empty dashboard | Charts render an explicit empty state rather than a broken axis. |

## Testing

39 unit tests and 21 API integration tests.

I aimed the unit tests at the places where a mistake would be *silent*:
authorisation across every role and module, token tampering and expiry,
validation boundaries, and the pagination and sort allow-list. The most
valuable single test is probably the one asserting that a decoded-but-unverified
token leaks no clinician data — that is a property that could regress
invisibly.

The integration tests run the real Express app against a real PostgreSQL and
cover the things that only emerge end-to-end: that a nurse's list contains
only their own rows, that an out-of-scope fetch 404s rather than 403s, and
that a denied request actually lands in the audit table. They skip
automatically when no database is reachable, so `npm test` stays green on a
fresh checkout.

## What worked well

- The permission model. Once `READ_OWNED` existed as a real concept, the
  role differences stopped being scattered conditionals and became data.
- The shared response envelope. Every error in the console is read from one
  path, so error handling never became a per-endpoint concern.
- Seeding realistic data with a deterministic PRNG and seasonal weighting.
  The dashboard shows a believable monsoon spike in vector-borne disease,
  which made it far easier to judge whether the charts were readable.
- Extracting the authorisation match into a pure function. It made the most
  security-critical logic in the system directly unit-testable.

## What I would improve

Honestly, in priority order:

1. **Offline-first data entry.** This is the biggest gap relative to the real
   use case. Rural outreach units frequently have no connectivity, and my
   implementation assumes a live connection. A service worker with an
   IndexedDB queue and conflict resolution on reconnect is the correct design,
   and it would change some data-model decisions (client-generated IDs, a
   sync status per record).
2. **Refresh tokens.** Three hours then a hard sign-in is wrong for a clinic.
3. **Real-time updates.** I refetch on mutation and on demand. The brief allows
   either, but SSE or a WebSocket would let a second clinician see a
   colleague's entry appear.
4. **Versioned migrations.** `sync({ alter: true })` is right for a
   single-writer service and wrong the moment anything else touches the
   database.
5. **Redis for the permission cache**, so a role change invalidates across
   replicas rather than within one process.
6. **Per-account rate limiting on login**, in addition to the global limiter.
7. **Playwright E2E tests** for the three role journeys. My integration tests
   hit the API, not the browser.

## What I would ask before building this for real

- Do clinicians need to re-identify a patient at a different facility? That
  single answer decides whether pseudonymisation is viable or whether a
  separate, tightly-controlled identity service is required.
- What is the actual connectivity profile? It determines whether offline-first
  is a nice-to-have or the primary constraint.
- Who is legally accountable for the audit trail, and what retention does that
  imply?
- Does notifiable-disease reporting need to be an automated submission to the
  district system rather than a number on a dashboard?
