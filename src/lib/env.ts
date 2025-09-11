// Small helper to validate environment variables at runtime.
// Use this to fail fast with a clear message instead of relying on non-null assertions.
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is not set. Please add it to your environment or .env file (see .env.example).`);
  }
  return v;
}

export function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}
