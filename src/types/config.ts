export interface ServerConfig {
  mongodbUri: string;
  mongodbTimeout: number;
  mongodbSocketTimeoutMs: number;
  mongodbMaxPoolSize: number;
  mongodbMinPoolSize: number;
  mongodbMaxIdleTimeMs: number;
  mongodbWaitQueueTimeoutMs: number;
  schemaSampleSize: number;
  readOnly: boolean;
  disabledTools: string[];
}
export const DEFAULT_CONFIG: Omit<ServerConfig, 'mongodbUri'> = {
  mongodbTimeout: 30000,
  mongodbSocketTimeoutMs: 0,
  mongodbMaxPoolSize: 4,
  mongodbMinPoolSize: 0,
  mongodbMaxIdleTimeMs: 30000,
  mongodbWaitQueueTimeoutMs: 5000,
  schemaSampleSize: 1000,
  readOnly: false,
  disabledTools: [],
};

export const WRITE_TOOLS = [
  'insert_one',
  'insert_many',
  'update_one',
  'update_many',
  'delete_one',
  'delete_many',
  'create_index',
  'drop_index',
  'create_collection',
  'drop_collection',
  'rename_collection',
  'drop_database',
];

export const CONFIRMATION_REQUIRED_TOOLS = [
  'delete_one',
  'delete_many',
  'drop_index',
  'drop_collection',
  'drop_database',
];
let currentConfig: ServerConfig | null = null;
function parseEnvInt(name: string, defaultValue: number, minValue: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === '') {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < minValue) {
    throw new Error(`${name} must be an integer >= ${minValue}`);
  }

  return parsed;
}
export function loadConfig(): ServerConfig {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const disabledToolsStr = process.env.MONGODB_DISABLED_TOOLS || '';
  const disabledTools = disabledToolsStr
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const mongodbTimeout = parseEnvInt('MONGODB_TIMEOUT', DEFAULT_CONFIG.mongodbTimeout, 1);
  const mongodbSocketTimeoutMs = parseEnvInt('MONGODB_SOCKET_TIMEOUT_MS', DEFAULT_CONFIG.mongodbSocketTimeoutMs, 0);
  const mongodbMaxPoolSize = parseEnvInt('MONGODB_MAX_POOL_SIZE', DEFAULT_CONFIG.mongodbMaxPoolSize, 1);
  const mongodbMinPoolSize = parseEnvInt('MONGODB_MIN_POOL_SIZE', DEFAULT_CONFIG.mongodbMinPoolSize, 0);
  const mongodbMaxIdleTimeMs = parseEnvInt('MONGODB_MAX_IDLE_TIME_MS', DEFAULT_CONFIG.mongodbMaxIdleTimeMs, 0);
  const mongodbWaitQueueTimeoutMs = parseEnvInt(
    'MONGODB_WAIT_QUEUE_TIMEOUT_MS',
    DEFAULT_CONFIG.mongodbWaitQueueTimeoutMs,
    0
  );
  const schemaSampleSize = parseEnvInt('SCHEMA_SAMPLE_SIZE', DEFAULT_CONFIG.schemaSampleSize, 1);

  if (mongodbMinPoolSize > mongodbMaxPoolSize) {
    throw new Error('MONGODB_MIN_POOL_SIZE cannot be greater than MONGODB_MAX_POOL_SIZE');
  }

  currentConfig = {
    mongodbUri,
    mongodbTimeout,
    mongodbSocketTimeoutMs,
    mongodbMaxPoolSize,
    mongodbMinPoolSize,
    mongodbMaxIdleTimeMs,
    mongodbWaitQueueTimeoutMs,
    schemaSampleSize,
    readOnly: process.env.MONGODB_READONLY === 'true',
    disabledTools,
  };
  return currentConfig;
}
export function getConfig(): ServerConfig {
  if (!currentConfig) {
    return loadConfig();
  }
  return currentConfig;
}
export function isToolDisabled(toolName: string): boolean {
  const config = getConfig();
  return config.disabledTools.includes(toolName);
}
export function isWriteOperation(toolName: string): boolean {
  return WRITE_TOOLS.includes(toolName);
}
export function isToolAllowed(toolName: string): { allowed: boolean; reason?: string } {
  const config = getConfig();

  if (config.disabledTools.includes(toolName)) {
    return { allowed: false, reason: `Tool '${toolName}' is disabled via MONGODB_DISABLED_TOOLS` };
  }

  if (config.readOnly && isWriteOperation(toolName)) {
    return { allowed: false, reason: `Tool '${toolName}' is a write operation. Server is in read-only mode (MONGODB_READONLY=true)` };
  }
  return { allowed: true };
}
