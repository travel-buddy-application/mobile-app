import Constants from "expo-constants";

interface Config {
  apiBaseUrl: string;
  appName: string;
  version: string;
  environment: "development" | "staging" | "production";
  api: {
    timeout: number;
    retryAttempts: number;
  };
}

// Default configuration
const defaultConfig: Config = {
  apiBaseUrl: "https://api.travel-buddy.com/v1",
  appName: "Travel Buddy",
  version: "1.0.0",
  environment: "development",
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
  },
};

// Environment-specific overrides
const developmentConfig: Partial<Config> = {
  apiBaseUrl: "http://localhost:3000/v1",
};

const stagingConfig: Partial<Config> = {
  apiBaseUrl: "https://api-staging.travel-buddy.com/v1",
};

const productionConfig: Partial<Config> = {
  apiBaseUrl: "https://api.travel-buddy.com/v1",
};

// Determine environment
const getEnvironment = (): "development" | "staging" | "production" => {
  if (__DEV__) {
    return "development";
  }

  const releaseChannel = Constants.releaseChannel;

  if (releaseChannel === "staging") {
    return "staging";
  }

  return "production";
};

// Get environment-specific config
const getEnvironmentConfig = (env: string): Partial<Config> => {
  switch (env) {
    case "development":
      return developmentConfig;
    case "staging":
      return stagingConfig;
    case "production":
      return productionConfig;
    default:
      return {};
  }
};

// Merge configurations
const createConfig = (): Config => {
  const environment = getEnvironment();
  const environmentConfig = getEnvironmentConfig(environment);

  return {
    ...defaultConfig,
    ...environmentConfig,
    environment,
    version: Constants.expoConfig?.version || defaultConfig.version,
  };
};

// Export the merged configuration
export const config = createConfig();

// Export individual config sections for convenience
export const {
  apiBaseUrl,
  appName,
  version,
  environment,
  api: apiConfig,
} = config;

// Utility functions for config access
export const isProduction = () => environment === "production";
export const isDevelopment = () => environment === "development";
export const isStaging = () => environment === "staging";

// API endpoint builders
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${apiBaseUrl}/${cleanEndpoint}`;
};
