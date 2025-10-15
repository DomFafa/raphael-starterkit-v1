/**
 * Environment variable configuration and validation
 * This utility ensures all required environment variables are properly set
 * and provides helpful error messages for missing configurations.
 */

interface EnvConfig {
  // Supabase Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;

  // OpenAI/OpenRouter Configuration
  openaiApiKey: string;
  openaiBaseUrl?: string;
  openrouterApiKey?: string;

  // Creem Payment Configuration
  creemApiKey: string;
  creemWebhookSecret: string;
  creemBaseUrl: string;

  // Application Configuration
  baseUrl: string;
  nodeEnv: string;

  // Optional Product IDs (defaults will be used if not provided)
  creemStarterProductId?: string;
  creemBusinessProductId?: string;
  creemEnterpriseProductId?: string;
  creemBasicCreditsId?: string;
  creemStandardCreditsId?: string;
  creemPremiumCreditsId?: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(`Environment Configuration Error: ${message}`);
    this.name = 'EnvValidationError';
  }
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new EnvValidationError(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

function validateUrl(url: string, key: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new EnvValidationError(`Invalid URL for ${key}: ${url}`);
  }
}

export function getEnvConfig(): EnvConfig {
  try {
    const config: EnvConfig = {
      // Supabase Configuration
      supabaseUrl: validateUrl(getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'), 'NEXT_PUBLIC_SUPABASE_URL'),
      supabaseAnonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      supabaseServiceRoleKey: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

      // OpenAI/OpenRouter Configuration
      openaiApiKey: getRequiredEnvVar('OPENROUTER_API_KEY') || getRequiredEnvVar('OPENAI_API_KEY'),
      openaiBaseUrl: getOptionalEnvVar('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1'),
      openrouterApiKey: getOptionalEnvVar('OPENROUTER_API_KEY'),

      // Creem Payment Configuration
      creemApiKey: getRequiredEnvVar('CREEM_API_KEY'),
      creemWebhookSecret: getRequiredEnvVar('CREEM_WEBHOOK_SECRET'),
      // Use CREEM_API_URL to match usage across the codebase and .env.example
      creemBaseUrl: validateUrl(getRequiredEnvVar('CREEM_API_URL'), 'CREEM_API_URL'),

      // Application Configuration
      // Accept BASE_URL with or without scheme; default to http on localhost
      baseUrl: (() => {
        const raw = getOptionalEnvVar('BASE_URL', 'http://localhost:3000') as string;
        const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
        return validateUrl(withScheme, 'BASE_URL');
      })(),
      nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),

      // Optional Product IDs
      creemStarterProductId: getOptionalEnvVar('CREEM_STARTER_PRODUCT_ID'),
      creemBusinessProductId: getOptionalEnvVar('CREEM_BUSINESS_PRODUCT_ID'),
      creemEnterpriseProductId: getOptionalEnvVar('CREEM_ENTERPRISE_PRODUCT_ID'),
      creemBasicCreditsId: getOptionalEnvVar('CREEM_BASIC_CREDITS_ID'),
      creemStandardCreditsId: getOptionalEnvVar('CREEM_STANDARD_CREDITS_ID'),
      creemPremiumCreditsId: getOptionalEnvVar('CREEM_PREMIUM_CREDITS_ID'),
    };

    return config;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('🚨 Environment Configuration Error:');
      console.error(error.message);
      console.error('\nPlease check your .env.local file and ensure all required environment variables are set.');
      console.error('\nRequired variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL');
      console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.error('- SUPABASE_SERVICE_ROLE_KEY');
      console.error('- OPENROUTER_API_KEY or OPENAI_API_KEY');
      console.error('- CREEM_API_KEY');
      console.error('- CREEM_WEBHOOK_SECRET');
      console.error('- CREEM_API_URL');

      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
    throw error;
  }
}

// Cache the configuration to avoid repeated validation
let cachedConfig: EnvConfig | null = null;

export function getCachedEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = getEnvConfig();
  }
  return cachedConfig;
}

// Validate environment variables at startup
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    getEnvConfig();
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof EnvValidationError) {
      errors.push(error.message);
    } else if (error instanceof Error) {
      errors.push(error.message);
    }
    return { isValid: false, errors };
  }
}

// Development helper to check environment status
export function logEnvironmentStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getCachedEnvConfig();
    console.log('📋 Environment Configuration Status:');
    console.log(`✅ Supabase URL: ${config.supabaseUrl}`);
    console.log(`✅ OpenAI API Key: ${config.openaiApiKey ? 'Set' : 'Missing'}`);
    console.log(`✅ Creem API Key: ${config.creemApiKey ? 'Set' : 'Missing'}`);
    console.log(`✅ Base URL: ${config.baseUrl}`);
    console.log(`✅ Environment: ${config.nodeEnv}`);
  }
}
