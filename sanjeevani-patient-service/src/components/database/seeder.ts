import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import _ from "lodash";
import { QueryTypes } from "sequelize";

import { databaseManager } from "@/components/database/index.js";
import { Logger } from "@/logger/index.js";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  FACILITY_TYPES,
  GENDER_TYPES,
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
  ROLES,
  USER_STATUS_TYPES,
} from "@/types/index.js";
import { env } from "@/utils/env.js";
import { KeyGenerators } from "@/utils/keygenerators.js";

/**
 * Deterministic PRNG so every environment seeds an identical dataset — the
 * dashboard screenshots in the docs then always match what a reviewer sees.
 */
const createRandom = (seed: number): (() => number) => {
  let state = seed;
  return (): number => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

const random = createRandom(20_260_910);

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)]!;

const between = (min: number, max: number): number =>
  Math.floor(random() * (max - min + 1)) + min;

// ---------------------------------------------------------------------------
// PERMISSION MATRIX
// ---------------------------------------------------------------------------

const PERMISSION_CATALOG: {
  module: PERMISSION_MODULES;
  sub_module: PERMISSION_SUB_MODULES;
  name: PERMISSIONS;
  description: string;
}[] = [
  ...Object.values(PERMISSIONS).map((name) => ({
    module: PERMISSION_MODULES.PATIENT_MANAGEMENT,
    sub_module: PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
    name,
    description: `${name} on patient records`,
  })),
  ...Object.values(PERMISSIONS).map((name) => ({
    module: PERMISSION_MODULES.PATIENT_MANAGEMENT,
    sub_module: PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    name,
    description: `${name} on clinical encounters`,
  })),
  {
    module: PERMISSION_MODULES.ANALYTICS,
    sub_module: PERMISSION_SUB_MODULES.DASHBOARD,
    name: PERMISSIONS.READ_ALL,
    description: "View the district health analytics dashboard",
  },
  {
    module: PERMISSION_MODULES.ADMINISTRATION,
    sub_module: PERMISSION_SUB_MODULES.AUDIT_LOGS,
    name: PERMISSIONS.READ_ALL,
    description: "View the platform audit trail",
  },
  {
    module: PERMISSION_MODULES.ADMINISTRATION,
    sub_module: PERMISSION_SUB_MODULES.USERS_MANAGEMENT,
    name: PERMISSIONS.READ_ALL,
    description: "View platform users",
  },
  {
    module: PERMISSION_MODULES.ADMINISTRATION,
    sub_module: PERMISSION_SUB_MODULES.USERS_MANAGEMENT,
    name: PERMISSIONS.WRITE_ALL,
    description: "Create and update platform users",
  },
];

/**
 * Role capabilities, expressed as `MODULE:SUB_MODULE:PERMISSION`.
 *
 * - DOCTOR reads and writes all clinical data but sees no analytics or audit.
 * - NURSE is scoped to `_OWNED`, so ownership filters restrict every query to
 *   the records that nurse personally entered.
 * - ADMIN analyses trends and administers users but holds no clinical write.
 */
const ROLE_MATRIX: Record<ROLES, string[]> = {
  [ROLES.DOCTOR]: [
    "PATIENT_MANAGEMENT:PATIENTS_MANAGEMENT:READ_ALL",
    "PATIENT_MANAGEMENT:PATIENTS_MANAGEMENT:WRITE_ALL",
    "PATIENT_MANAGEMENT:ENCOUNTERS_MANAGEMENT:READ_ALL",
    "PATIENT_MANAGEMENT:ENCOUNTERS_MANAGEMENT:WRITE_ALL",
  ],
  [ROLES.NURSE]: [
    "PATIENT_MANAGEMENT:PATIENTS_MANAGEMENT:READ_OWNED",
    "PATIENT_MANAGEMENT:PATIENTS_MANAGEMENT:WRITE_OWNED",
    "PATIENT_MANAGEMENT:ENCOUNTERS_MANAGEMENT:READ_OWNED",
    "PATIENT_MANAGEMENT:ENCOUNTERS_MANAGEMENT:WRITE_OWNED",
  ],
  [ROLES.ADMIN]: [
    "PATIENT_MANAGEMENT:PATIENTS_MANAGEMENT:READ_ALL",
    "PATIENT_MANAGEMENT:ENCOUNTERS_MANAGEMENT:READ_ALL",
    "ANALYTICS:DASHBOARD:READ_ALL",
    "ADMINISTRATION:AUDIT_LOGS:READ_ALL",
    "ADMINISTRATION:USERS_MANAGEMENT:READ_ALL",
    "ADMINISTRATION:USERS_MANAGEMENT:WRITE_ALL",
  ],
};

// ---------------------------------------------------------------------------
// MASTER DATA
// ---------------------------------------------------------------------------

const FACILITIES = [
  {
    code: "PHC-RAIGAD-01",
    name: "Mangaon Primary Health Centre",
    type: FACILITY_TYPES.PRIMARY_HEALTH_CENTRE,
    district: "Raigad",
    state: "Maharashtra",
  },
  {
    code: "CHC-RATNAGIRI-01",
    name: "Khed Community Health Centre",
    type: FACILITY_TYPES.COMMUNITY_HEALTH_CENTRE,
    district: "Ratnagiri",
    state: "Maharashtra",
  },
  {
    code: "SC-PALGHAR-04",
    name: "Jawhar Sub Centre",
    type: FACILITY_TYPES.SUB_CENTRE,
    district: "Palghar",
    state: "Maharashtra",
  },
  {
    code: "MOU-NASHIK-02",
    name: "Peth Mobile Outreach Unit",
    type: FACILITY_TYPES.MOBILE_OUTREACH_UNIT,
    district: "Nashik",
    state: "Maharashtra",
  },
  {
    code: "DH-GADCHIROLI-01",
    name: "Gadchiroli District Hospital",
    type: FACILITY_TYPES.DISTRICT_HOSPITAL,
    district: "Gadchiroli",
    state: "Maharashtra",
  },
];

const DIAGNOSIS_CATEGORIES = [
  {
    code: "VIRAL",
    name: "Viral Fever & Influenza",
    description: "Seasonal viral infections and influenza-like illness",
    is_notifiable: false,
  },
  {
    code: "RESPIRATORY",
    name: "Respiratory",
    description: "Asthma, COPD, pneumonia and lower respiratory infections",
    is_notifiable: false,
  },
  {
    code: "GASTRO",
    name: "Gastrointestinal",
    description: "Diarrhoeal disease, gastritis and enteric infections",
    is_notifiable: false,
  },
  {
    code: "VECTOR_BORNE",
    name: "Vector-Borne Disease",
    description: "Malaria, dengue and chikungunya",
    is_notifiable: true,
  },
  {
    code: "DIABETES",
    name: "Diabetes & Metabolic",
    description: "Type 2 diabetes, thyroid and metabolic disorders",
    is_notifiable: false,
  },
  {
    code: "CARDIO",
    name: "Cardiovascular",
    description: "Hypertension and ischaemic heart disease",
    is_notifiable: false,
  },
  {
    code: "MATERNAL",
    name: "Maternal & Child Health",
    description: "Antenatal, postnatal and paediatric care",
    is_notifiable: false,
  },
  {
    code: "TUBERCULOSIS",
    name: "Tuberculosis",
    description: "Pulmonary and extra-pulmonary tuberculosis",
    is_notifiable: true,
  },
  {
    code: "DERMATOLOGY",
    name: "Dermatology",
    description: "Skin infections, dermatitis and fungal disease",
    is_notifiable: false,
  },
  {
    code: "NUTRITION",
    name: "Malnutrition & Anaemia",
    description: "Undernutrition, anaemia and micronutrient deficiency",
    is_notifiable: false,
  },
  {
    code: "TRAUMA",
    name: "Injury & Trauma",
    description: "Accidental injury, burns and animal bites",
    is_notifiable: false,
  },
];

const USERS = [
  {
    employee_id: "SNJ-ADM-001",
    email: "admin@sanjeevani.health",
    first_name: "Rohan",
    last_name: "Deshpande",
    role: ROLES.ADMIN,
    facility_index: null,
  },
  {
    employee_id: "SNJ-DOC-001",
    email: "doctor@sanjeevani.health",
    first_name: "Meera",
    last_name: "Kulkarni",
    role: ROLES.DOCTOR,
    facility_index: 0,
  },
  {
    employee_id: "SNJ-DOC-002",
    email: "arjun.rane@sanjeevani.health",
    first_name: "Arjun",
    last_name: "Rane",
    role: ROLES.DOCTOR,
    facility_index: 1,
  },
  {
    employee_id: "SNJ-DOC-003",
    email: "fatima.shaikh@sanjeevani.health",
    first_name: "Fatima",
    last_name: "Shaikh",
    role: ROLES.DOCTOR,
    facility_index: 4,
  },
  {
    employee_id: "SNJ-NUR-001",
    email: "nurse@sanjeevani.health",
    first_name: "Anjali",
    last_name: "Pawar",
    role: ROLES.NURSE,
    facility_index: 2,
  },
  {
    employee_id: "SNJ-NUR-002",
    email: "sunita.gaikwad@sanjeevani.health",
    first_name: "Sunita",
    last_name: "Gaikwad",
    role: ROLES.NURSE,
    facility_index: 3,
  },
];

// ---------------------------------------------------------------------------
// CLINICAL NARRATIVE FRAGMENTS
// ---------------------------------------------------------------------------

const CLINICAL_PROFILES: Record<
  string,
  { complaints: string[]; diagnoses: string[]; symptoms: string[]; treatments: string[] }
> = {
  VIRAL: {
    complaints: ["High-grade fever for 3 days", "Fever with body ache", "Fever and sore throat"],
    diagnoses: ["Acute viral fever", "Influenza-like illness", "Upper respiratory viral infection"],
    symptoms: ["Fever", "Headache", "Body ache", "Sore throat", "Fatigue", "Chills"],
    treatments: [
      "Paracetamol 500mg TDS for 3 days, oral fluids, rest",
      "Symptomatic management, ORS, review after 48 hours",
    ],
  },
  RESPIRATORY: {
    complaints: ["Breathlessness on exertion", "Persistent cough for 2 weeks", "Wheezing at night"],
    diagnoses: ["Acute bronchitis", "Bronchial asthma - moderate persistent", "Community-acquired pneumonia"],
    symptoms: ["Cough", "Breathlessness", "Wheezing", "Chest tightness", "Sputum production"],
    treatments: [
      "Salbutamol inhaler 2 puffs SOS, steam inhalation",
      "Amoxicillin 500mg TDS for 5 days, bronchodilator nebulisation",
    ],
  },
  GASTRO: {
    complaints: ["Loose motions since morning", "Abdominal pain with vomiting", "Watery stools for 2 days"],
    diagnoses: ["Acute gastroenteritis", "Acute diarrhoeal disease", "Food-borne enteritis"],
    symptoms: ["Diarrhoea", "Vomiting", "Abdominal cramps", "Dehydration", "Nausea"],
    treatments: ["ORS sachets, zinc supplementation for 14 days", "IV fluids, ondansetron, oral rehydration"],
  },
  VECTOR_BORNE: {
    complaints: ["Fever with chills and rigors", "Fever with retro-orbital pain", "Intermittent high fever"],
    diagnoses: ["Plasmodium vivax malaria", "Dengue fever without warning signs", "Chikungunya fever"],
    symptoms: ["Fever", "Chills", "Rigors", "Joint pain", "Retro-orbital pain", "Rash"],
    treatments: [
      "Chloroquine as per NVBDCP protocol, notified to district unit",
      "Supportive care, daily platelet monitoring, notified to district unit",
    ],
  },
  DIABETES: {
    complaints: ["Routine sugar check", "Increased thirst and urination", "Follow-up for diabetes"],
    diagnoses: ["Type 2 diabetes mellitus - uncontrolled", "Type 2 diabetes mellitus - on treatment", "Impaired glucose tolerance"],
    symptoms: ["Polyuria", "Polydipsia", "Weight loss", "Fatigue", "Blurred vision"],
    treatments: ["Metformin 500mg BD, dietary counselling, HbA1c after 3 months", "Continue current regimen, monthly sugar monitoring"],
  },
  CARDIO: {
    complaints: ["Headache with giddiness", "Routine BP check", "Chest discomfort on walking"],
    diagnoses: ["Essential hypertension - stage 2", "Essential hypertension - stage 1", "Stable angina"],
    symptoms: ["Headache", "Giddiness", "Palpitations", "Chest discomfort", "Breathlessness"],
    treatments: ["Amlodipine 5mg OD, salt restriction, weekly BP monitoring", "Lifestyle modification, review in 4 weeks"],
  },
  MATERNAL: {
    complaints: ["Antenatal check-up", "Postnatal follow-up", "Child immunisation visit"],
    diagnoses: ["Antenatal care - second trimester", "Postnatal care - week 2", "Routine immunisation"],
    symptoms: ["Routine visit", "Mild anaemia", "Lower back pain", "Fatigue"],
    treatments: ["Iron and folic acid supplementation, TT booster", "Nutrition counselling, next visit in 4 weeks"],
  },
  TUBERCULOSIS: {
    complaints: ["Cough for more than 3 weeks", "Evening rise of temperature", "Weight loss with cough"],
    diagnoses: ["Pulmonary tuberculosis - sputum positive", "Pulmonary tuberculosis - on DOTS"],
    symptoms: ["Chronic cough", "Evening fever", "Night sweats", "Weight loss", "Haemoptysis"],
    treatments: ["Initiated on DOTS category I, notified to district TB officer", "Continue DOTS, monthly sputum follow-up"],
  },
  DERMATOLOGY: {
    complaints: ["Itchy rash over arms", "Scaly patches on scalp", "Painful skin lesion"],
    diagnoses: ["Tinea corporis", "Scabies", "Contact dermatitis"],
    symptoms: ["Itching", "Rash", "Scaling", "Redness", "Skin lesion"],
    treatments: ["Topical clotrimazole BD for 3 weeks, hygiene advice", "Permethrin 5% application, treat all contacts"],
  },
  NUTRITION: {
    complaints: ["Weakness and tiredness", "Child not gaining weight", "Pallor noticed by ASHA worker"],
    diagnoses: ["Iron deficiency anaemia - moderate", "Moderate acute malnutrition", "Severe acute malnutrition"],
    symptoms: ["Pallor", "Fatigue", "Poor appetite", "Weight loss", "Breathlessness on exertion"],
    treatments: ["Iron-folic acid supplementation, dietary counselling", "Referred to nutrition rehabilitation centre"],
  },
  TRAUMA: {
    complaints: ["Fall from height", "Dog bite on left leg", "Road traffic accident"],
    diagnoses: ["Soft tissue injury", "Animal bite - category III", "Laceration wound"],
    symptoms: ["Pain", "Swelling", "Bleeding", "Restricted movement", "Bruising"],
    treatments: ["Wound cleaning, tetanus prophylaxis, analgesia", "Anti-rabies vaccination schedule initiated, wound toilet"],
  },
};

/** Monsoon and winter peaks, so the trend chart tells a believable story. */
const SEASONAL_WEIGHTS: Record<string, number[]> = {
  VIRAL: [1, 1, 1, 1.2, 1.4, 1.8, 2.2, 2, 1.6, 1.3, 1.5, 1.4],
  VECTOR_BORNE: [0.4, 0.3, 0.4, 0.6, 1, 1.8, 2.6, 3, 2.4, 1.4, 0.8, 0.5],
  GASTRO: [0.8, 0.8, 1, 1.2, 1.6, 2.2, 2.4, 2, 1.4, 1, 0.9, 0.8],
  RESPIRATORY: [1.6, 1.4, 1, 0.8, 0.8, 1, 1.2, 1.2, 1.2, 1.4, 1.8, 2],
};

const seedDatabase = async (): Promise<void> => {
  const { models } = databaseManager;

  // MASTER DATA STARTS
  const roles = await Promise.all(
    Object.values(ROLES).map(async (name) => {
      const [role] = await models.roles.findOrCreate({
        where: { name },
        defaults: {
          id: KeyGenerators.entityId("IAM-ROLE"),
          name,
          description: `${_.capitalize(name)} role`,
        },
      });
      return role;
    }),
  );

  const permissions = await Promise.all(
    PERMISSION_CATALOG.map(async (entry) => {
      const [permission] = await models.permissions.findOrCreate({
        where: {
          module: entry.module,
          sub_module: entry.sub_module,
          name: entry.name,
        },
        defaults: { id: KeyGenerators.entityId("IAM-PERMISSION"), ...entry },
      });
      return permission;
    }),
  );

  for (const role of roles) {
    for (const scope of ROLE_MATRIX[role.name]) {
      const [module, subModule, permissionName] = scope.split(":");
      const permission = permissions.find(
        (item) =>
          item.module === module &&
          item.sub_module === subModule &&
          item.name === permissionName,
      );
      if (!permission) continue;

      await models.rolepermissions.findOrCreate({
        where: { role_id: role.id, permission_id: permission.id },
        defaults: {
          id: KeyGenerators.entityId("IAM-ROLE-PERMISSION"),
          role_id: role.id,
          permission_id: permission.id,
        },
      });
    }
  }

  const facilities = await Promise.all(
    FACILITIES.map(async (entry) => {
      const [facility] = await models.facilities.findOrCreate({
        where: { code: entry.code },
        defaults: { id: KeyGenerators.entityId("FACILITY"), ...entry },
      });
      return facility;
    }),
  );

  const categories = await Promise.all(
    DIAGNOSIS_CATEGORIES.map(async (entry) => {
      const [category] = await models.diagnosiscategories.findOrCreate({
        where: { code: entry.code },
        defaults: {
          id: KeyGenerators.entityId("DIAGNOSIS-CATEGORY"),
          ...entry,
        },
      });
      return category;
    }),
  );
  // MASTER DATA ENDS

  // USERS STARTS
  const passwordHash = await bcrypt.hash(
    env.SEED_DEFAULT_PASSWORD,
    env.BCRYPT_SALT_ROUNDS,
  );

  const users = await Promise.all(
    USERS.map(async (entry) => {
      const role = roles.find((item) => item.name === entry.role)!;
      const [user] = await models.users.findOrCreate({
        where: { email: entry.email },
        defaults: {
          id: KeyGenerators.entityId("USER"),
          employee_id: entry.employee_id,
          email: entry.email,
          first_name: entry.first_name,
          last_name: entry.last_name,
          password_hash: passwordHash,
          role_id: role.id,
          facility_id:
            entry.facility_index === null
              ? null
              : facilities[entry.facility_index]!.id,
          status: USER_STATUS_TYPES.ACTIVE,
        },
      });
      return user;
    }),
  );
  // USERS ENDS

  // CLINICAL DEMO DATA STARTS
  // Keyed on encounters rather than patients so a run interrupted partway
  // through resumes instead of leaving the dataset half-built.
  const existingEncounters = await models.encounters.count();
  if (existingEncounters > 0) {
    Logger.info("Clinical demo data already present - skipping generation.");
    return;
  }

  const clinicians = users.filter((user) =>
    USERS.some(
      (entry) =>
        entry.email === user.email &&
        (entry.role === ROLES.DOCTOR || entry.role === ROLES.NURSE),
    ),
  );

  const patients = await models.patients.findAll();

  for (let index = patients.length + 1; index <= 120; index += 1) {
    const facility = pick(facilities);
    const gender = pick(Object.values(GENDER_TYPES));
    const age = between(1, 88);

    patients.push(
      await models.patients.create({
        patient_code: KeyGenerators.patientCode(index),
        age,
        gender,
        district: facility.district,
        state: facility.state,
        facility_id: facility.id,
        chronic_conditions:
          age > 45 && random() > 0.6
            ? [pick(["Hypertension", "Type 2 Diabetes", "Asthma", "Anaemia"])]
            : [],
        is_pregnant:
          gender === GENDER_TYPES.FEMALE && age >= 18 && age <= 40
            ? random() > 0.85
            : false,
        created_by: pick(clinicians).id,
      }),
    );
  }

  const encounters = [];
  for (let day = 180; day >= 0; day -= 1) {
    const date = dayjs().subtract(day, "day");
    const monthIndex = date.month();
    const dailyVolume = between(1, 5);

    for (let visit = 0; visit < dailyVolume; visit += 1) {
      const category = pick(categories);
      const weight = SEASONAL_WEIGHTS[category.code]?.[monthIndex] ?? 1;
      if (random() > weight / 3) continue;

      const patient = pick(patients);
      const clinician = pick(clinicians);
      const profile = CLINICAL_PROFILES[category.code]!;
      const severity = pick([
        ENCOUNTER_SEVERITY.MILD,
        ENCOUNTER_SEVERITY.MILD,
        ENCOUNTER_SEVERITY.MODERATE,
        ENCOUNTER_SEVERITY.MODERATE,
        ENCOUNTER_SEVERITY.SEVERE,
        ENCOUNTER_SEVERITY.CRITICAL,
      ]);

      encounters.push({
        patient_id: patient.id,
        clinician_id: clinician.id,
        facility_id: patient.facility_id,
        diagnosis_category_id: category.id,
        encounter_date: date
          .hour(between(8, 17))
          .minute(between(0, 59))
          .toDate(),
        visit_type: pick(Object.values(ENCOUNTER_VISIT_TYPES)),
        chief_complaint: pick(profile.complaints),
        symptoms: _.sampleSize(profile.symptoms, between(2, 4)),
        diagnosis: pick(profile.diagnoses),
        severity,
        status:
          severity === ENCOUNTER_SEVERITY.CRITICAL
            ? ENCOUNTER_STATUS.REFERRED
            : pick([
                ENCOUNTER_STATUS.CLOSED,
                ENCOUNTER_STATUS.CLOSED,
                ENCOUNTER_STATUS.UNDER_TREATMENT,
                ENCOUNTER_STATUS.FOLLOW_UP_REQUIRED,
              ]),
        treatment: pick(profile.treatments),
        vitals: {
          temperature_celsius: Number((36.4 + random() * 3).toFixed(1)),
          systolic_bp: between(100, 165),
          diastolic_bp: between(62, 100),
          pulse_bpm: between(62, 118),
          spo2_percentage: between(92, 100),
          weight_kg: Number((12 + random() * 68).toFixed(1)),
        },
        follow_up_date:
          random() > 0.6 ? date.add(between(7, 30), "day").toDate() : null,
        notes: random() > 0.7 ? "Patient counselled on warning signs." : null,
        created_by: clinician.id,
      });
    }
  }

  await databaseManager.models.encounters.bulkCreate(encounters as never);
  // CLINICAL DEMO DATA ENDS

  Logger.info(
    `Seed complete: ${roles.length} roles, ${permissions.length} permissions, ${facilities.length} facilities, ${categories.length} diagnosis categories, ${users.length} users, ${patients.length} patients, ${encounters.length} encounters.`,
  );
};

/** Arbitrary but fixed - the key only has to be the same in every process. */
const SEED_ADVISORY_LOCK_KEY = 8_120_260_911;

/**
 * Seeding is guarded by a PostgreSQL advisory lock. Two processes starting at
 * once - a dev watcher restarting, or two replicas booting together - would
 * otherwise both see an empty table and both insert the demo dataset.
 */
export const runSeeder = async (): Promise<void> => {
  const [lock] = await databaseManager.driver.query<{ acquired: boolean }>(
    "SELECT pg_try_advisory_lock(:key) AS acquired",
    { type: QueryTypes.SELECT, replacements: { key: SEED_ADVISORY_LOCK_KEY } },
  );

  if (!lock?.acquired) {
    Logger.info("Another process is seeding - skipping.");
    return;
  }

  try {
    await seedDatabase();
  } catch (error) {
    Logger.error({ error }, "Database seeding failed.");
    throw error;
  } finally {
    await databaseManager.driver.query("SELECT pg_advisory_unlock(:key)", {
      type: QueryTypes.SELECT,
      replacements: { key: SEED_ADVISORY_LOCK_KEY },
    });
  }
};

// Allows `npm run db:seed` to execute this file directly.
if (process.argv[1]?.includes("seeder")) {
  await databaseManager.bootstrap();
  await runSeeder();
  await databaseManager.close();
}
