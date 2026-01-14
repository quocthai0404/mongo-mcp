export interface ServerConfig {
  mongodbUri: string;
  mongodbTimeout: number;
  schemaSampleSize: number;
}

export const DEFAULT_CONFIG: Omit<ServerConfig, 'mongodbUri'> = {
  mongodbTimeout: 30000,
  schemaSampleSize: 1000,
};

export function loadConfig(): ServerConfig {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  return {
    mongodbUri,
    mongodbTimeout: parseInt(process.env.MONGODB_TIMEOUT || '', 10) || DEFAULT_CONFIG.mongodbTimeout,
    schemaSampleSize: parseInt(process.env.SCHEMA_SAMPLE_SIZE || '', 10) || DEFAULT_CONFIG.schemaSampleSize,
  };
}
