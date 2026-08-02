export interface RuntimeConfiguration {
  AMAZON_MARKETPLACE: string;
  MONITOR_ENABLED: string;
  DAILY_PHASE_STEP_SECONDS: string;
  BASE_BLOCK_RETRY_SECONDS: string;
  MAX_BLOCK_RETRY_SECONDS: string;
  DISCOVERY_ENABLED: string;
  AMAZON_DISCOVERY_URL: string;
  AMAZON_DISCOVERY_QUERY: string;
}

export interface ConfigurationValidation {
  valid: boolean;
  errors: string[];
}

const booleanValues = new Set(["true", "false"]);

const integerInRange = (
  value: string,
  minimum: number,
  maximum: number,
): boolean => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum;
};

export function validateRuntimeConfiguration(
  env: RuntimeConfiguration,
): ConfigurationValidation {
  const errors: string[] = [];

  for (const key of ["MONITOR_ENABLED", "DISCOVERY_ENABLED"] as const) {
    if (!booleanValues.has(env[key]?.toLowerCase())) {
      errors.push(`${key} must be true or false.`);
    }
  }

  if (!/^[a-z0-9.-]+$/i.test(env.AMAZON_MARKETPLACE ?? "")) {
    errors.push("AMAZON_MARKETPLACE must be a hostname without a URL scheme.");
  }

  if (!integerInRange(env.DAILY_PHASE_STEP_SECONDS, 1, 59)) {
    errors.push("DAILY_PHASE_STEP_SECONDS must be an integer from 1 to 59.");
  }

  if (!integerInRange(env.BASE_BLOCK_RETRY_SECONDS, 1, 86400)) {
    errors.push("BASE_BLOCK_RETRY_SECONDS must be an integer from 1 to 86400.");
  }

  if (!integerInRange(env.MAX_BLOCK_RETRY_SECONDS, 1, 86400)) {
    errors.push("MAX_BLOCK_RETRY_SECONDS must be an integer from 1 to 86400.");
  }

  if (
    integerInRange(env.BASE_BLOCK_RETRY_SECONDS, 1, 86400) &&
    integerInRange(env.MAX_BLOCK_RETRY_SECONDS, 1, 86400) &&
    Number(env.MAX_BLOCK_RETRY_SECONDS) < Number(env.BASE_BLOCK_RETRY_SECONDS)
  ) {
    errors.push("MAX_BLOCK_RETRY_SECONDS must be at least BASE_BLOCK_RETRY_SECONDS.");
  }

  try {
    const discoveryUrl = new URL(env.AMAZON_DISCOVERY_URL);
    if (discoveryUrl.protocol !== "https:") {
      errors.push("AMAZON_DISCOVERY_URL must use HTTPS.");
    }
  } catch {
    errors.push("AMAZON_DISCOVERY_URL must be a valid URL.");
  }

  if (!(env.AMAZON_DISCOVERY_QUERY ?? "").trim()) {
    errors.push("AMAZON_DISCOVERY_QUERY must not be empty.");
  }

  return { valid: errors.length === 0, errors };
}

export function assertRuntimeConfiguration(
  env: RuntimeConfiguration,
): void {
  const validation = validateRuntimeConfiguration(env);
  if (!validation.valid) {
    throw new Error(`Invalid runtime configuration: ${validation.errors.join(" ")}`);
  }
}
