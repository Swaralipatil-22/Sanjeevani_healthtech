# Sanjeevani — user guide

For the people using the console day to day: nurses and doctors at outreach
facilities, and district administrators.

If you are setting the system up rather than using it, see the
[README](../README.md) instead.

---

## Signing in

Go to the console URL and enter the email address and password issued by your
district health administrator.

Sessions last **three hours**. After that you will be returned to the sign-in
page and will need to sign in again.

> **Before you start a long form**, check how long you have been signed in. If
> your session ends while you are part-way through recording an encounter,
> that entry is not saved.

---

## What your role lets you do

The console looks different depending on your role. This is deliberate — you
only see the areas you are responsible for.

| | Nurse | Doctor | Administrator |
|---|:--:|:--:|:--:|
| Register patients | own only | all | view only |
| Record encounters | own only | all | view only |
| Edit an encounter | own only | any | ✗ |
| District dashboard | ✗ | ✗ | ✓ |
| Audit trail | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |

**"Own only"** means you see the records you personally entered, and nobody
else's. If you are a nurse and cannot find a colleague's encounter, that is
the system working correctly — not a fault.

**Administrators cannot record or change clinical data.** They analyse trends
and manage accounts. Clinical entry belongs to clinicians.

---

## Patients have no names

This is the most important thing to understand about Sanjeevani.

The system stores **no patient name, phone number, address, or Aadhaar or
other government identifier**. Instead, each patient is issued a code such as
`SNJ-PT-000123`, and all their clinical history is linked to that code.

**Why:** if the database were ever exposed, there would be no way to work out
who any record belongs to.

**What this means for you day to day:**

- Give the patient their code — on a card, in their existing booklet, or
  written in their record book. They need it on every visit.
- To find a returning patient, search by their code, not their name.
- If a patient has lost their code, ask your facility in-charge. Re-issuing a
  code is deliberately a manual step.

Age, gender, district, facility and chronic conditions **are** recorded —
those are needed for treatment and for district-level trends, and none of them
identify a person on their own.

---

## Registering a patient

**Patients → Register Patient**

| Field | Notes |
|---|---|
| Age | In completed years. For infants under one, enter 0. |
| Gender | Female, Male or Other |
| District / State | Where the patient lives, not where the clinic is |
| Registering facility | Defaults to your posting |
| Chronic conditions | Tap the suggestions, or leave blank |
| Currently pregnant | Appears for female patients; flags the record for antenatal follow-up |

On save, the system issues the patient code. **Write it down and give it to the
patient before they leave.**

---

## Recording an encounter

**Encounters → Record Encounter**

The form has three steps. You can move back at any point before saving.

### Step 1 — Visit

- **Patient** — search by code. The patient must already be registered.
- **Facility** — where the consultation happened
- **Visit type** — New consultation, Follow-up, Teleconsultation or Emergency
- **Date and time** — defaults to now. You can back-date an entry recorded on
  paper in the field, but **not** set a future date.
- **Chief complaint** — in the patient's own words, e.g. *"fever for three
  days"*. Not your diagnosis.

### Step 2 — Clinical

- **Symptoms** — type and press Enter, or tap the suggested chips. At least
  one is required. Keep them as separate entries rather than one long phrase —
  this is what makes district trend analysis possible.
- **Diagnosis** — your clinical impression, in free text
- **Category** — pick the closest. Some are marked *(notifiable)*; see below.
- **Severity** — see the table below
- **Outcome** — Under treatment, Follow-up required, Referred or Closed
- **Vitals** — all optional. Record what you measured; leave the rest blank.
  Out-of-range values are rejected, and systolic must be higher than diastolic.
- **Treatment plan** — medication, dosage, duration and advice given

### Step 3 — Review

Set a follow-up date if needed, add any notes, then check the summary before
saving. **Nothing is saved until you press "Record encounter".**

---

## Severity — what to choose

| | Use when |
|---|---|
| **Mild** | Self-limiting; routine treatment and advice |
| **Moderate** | Needs active treatment and a planned review |
| **Severe** | Needs close monitoring or same-day escalation |
| **Critical** | Life-threatening; referral onward |

Severity drives the district dashboard's critical-case count, so an
administrator watching for an outbreak is reading what you enter here.

---

## Notifiable diseases

Two categories are marked **notifiable**: **Vector-Borne Disease** (malaria,
dengue, chikungunya) and **Tuberculosis**.

These are legally reportable to the district health office. When you pick one,
the encounter is counted separately on the dashboard and flagged in the list.

**Recording it here does not discharge your reporting obligation.** Follow your
facility's existing notification process as well.

---

## Finding and filtering records

Both the Patients and Encounters lists have:

- **Search** — codes, districts, diagnoses and complaints
- **Filters** (the sliders icon) — severity, outcome, visit type, category,
  facility and date range
- **Sorting** — click a column heading
- **Export** (the download icon) — CSV, JSON or Excel, honouring whatever
  filters you currently have applied

Every export is recorded in the audit trail, including who exported what.

---

## Updating and removing records

- **Doctors** can edit any encounter. **Nurses** can edit their own.
- Deleting an encounter is a *soft* delete — it disappears from lists but is
  retained and can be restored by an administrator.
- **A patient with any recorded encounter cannot be deleted.** Clinical history
  is never orphaned. Remove the encounters first if the record was created in
  error.

---

## For administrators: reading the dashboard

**District Dashboard**

### Choosing a period

The date control offers presets (last 7 / 30 / 90 / 180 days, month to date)
and a **custom range** below the line — pick any two dates for a quarter, a
monsoon season, or a period matching a district report.

The **Day / Week / Month** buttons change how the trend line is grouped. Use
Day for a short window, Month for a long one.

You can also narrow to a single facility.

### The figures

- **Total encounters** — the percentage compares against the immediately
  preceding period of the same length, so "+15%" against a 90-day window means
  against the 90 days before it
- **Patients seen** — unique patients, so someone seen three times counts once
- **Critical cases** — severity Critical, with referrals noted underneath
- **Notifiable disease** — reportable cases in the period
- **Follow-ups due** — follow-up dates still in the future

### The charts

- **Encounter volume** — total over time, with critical cases overlaid in red.
  Hover any point for exact numbers.
- **Diagnosis categories** — ranked by volume. Beyond eight categories the
  remainder is grouped as "Other".
- **Acuity mix** — the severity split
- **Age distribution** — which age groups the network is actually reaching,
  useful for spotting who is being missed
- **Facility load** — encounters per facility with critical counts

Everything on this page is an **aggregate**. No chart can be traced back to an
individual.

---

## For administrators: the audit trail

**Administration → Audit Trail**

An append-only record of every sign-in, clinical change, export and **denied**
request. Nothing here can be edited or deleted, by anyone.

Filter by action or result. `PERMISSION_DENIED` entries show someone attempting
to reach an area their role does not cover — worth reviewing periodically.

---

## Common questions

**I can't see an encounter a colleague recorded.**
Expected, if you are a nurse. Nurses see only their own entries.

**There's no dashboard in my sidebar.**
The dashboard is for administrators. Doctors and nurses do not have it.

**I was signed out while filling a form.**
Sessions last three hours. The entry was not saved and will need re-entering.
Sign in again before starting a long form.

**The form won't accept my follow-up date.**
It must be after the encounter date.

**The form won't accept a vital sign.**
Values outside physiological range are rejected, and systolic must exceed
diastolic. Re-check the reading; leave it blank if you did not measure it.

**A patient lost their code.**
Ask your facility in-charge. Re-issuing is a deliberate manual step, because
the system holds nothing that could identify the patient automatically.

**I registered a patient by mistake.**
If they have no encounters, delete the record. If they do, ask an
administrator.

---

## If something goes wrong

Every error message in the console carries a **request ID**. Quote it when
reporting a problem — it lets an administrator find the exact server log entry
and audit row for what you were doing.
