import { bool, cleanEnv, num, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  // SERVER
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  PORT: port({ default: 8000 }),
  SERVICE_BASE_PATH: str({ default: "/patient-service" }),
  ALLOWED_ORIGINS: str({ default: "http://localhost:3000" }),
  ALLOWED_HOSTNAMES: str({ default: "localhost,127.0.0.1" }),

  // DATABASE
  DB_HOST: str({ default: "localhost" }),
  DB_PORT: port({ default: 5432 }),
  DB_NAME: str({ default: "sanjeevani" }),
  DB_USERNAME: str({ default: "sanjeevani" }),
  DB_PASSWORD: str({ default: "sanjeevani" }),
  DB_SCHEMA: str({ default: "public" }),
  DB_SSL: bool({ default: false }),
  DB_POOL_MAX: num({ default: 10 }),
  DB_POOL_MIN: num({ default: 0 }),
  DB_LOGGING: bool({ default: false }),
  DB_SYNC: bool({ default: true }),
  DB_SEED: bool({ default: true }),

  // CRYPTOGRAPHY / AUTH
  AES_ENCRYPTION_KEY: str({ default: "sanjeevani_dev_aes_key_32_chars!" }),
  AES_ENCRYPTION_IV: str({ default: "sanjeevani_dev16" }),
  JWT_SECRET_KEY: str({ default: "sanjeevani_dev_jwt_secret_change_me" }),
  JWT_ISSUER: str({ default: "Sanjeevani" }),
  JWT_AUDIENCE: str({ default: "Sanjeevani" }),
  JWT_EXPIRY_IN_SECONDS: num({ default: 10_800 }),
  BCRYPT_SALT_ROUNDS: num({ default: 10 }),

  // OBSERVABILITY
  LOG_LEVEL: str({ default: "info" }),
  ENABLE_HTTP_LOGGING: bool({ default: true }),

  // RATE LIMITING
  RATE_LIMIT_WINDOW_IN_SECONDS: num({ default: 60 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 300 }),

  // SEED
  SEED_DEFAULT_PASSWORD: str({ default: "Sanjeevani@123" }),
});
