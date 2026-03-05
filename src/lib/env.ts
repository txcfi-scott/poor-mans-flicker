function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Check your .env.local file.`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Lazy initialization to avoid throwing during build
let _env: ReturnType<typeof loadEnv> | null = null;

function loadEnv() {
  return {
    // Database
    turso: {
      url: requireEnv('TURSO_DATABASE_URL'),
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    // Storage
    r2: {
      endpoint: requireEnv('R2_ENDPOINT'),
      accessKey: requireEnv('R2_ACCESS_KEY'),
      secretKey: requireEnv('R2_SECRET_KEY'),
      bucket: requireEnv('R2_BUCKET'),
      publicUrl: requireEnv('R2_PUBLIC_URL'),
    },
    // Auth
    adminToken: requireEnv('ADMIN_TOKEN'),
    // Storage provider
    storageProvider: optionalEnv('STORAGE_PROVIDER', 'r2'),
    // Site
    siteUrl: optionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  };
}

export function getEnv() {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}
