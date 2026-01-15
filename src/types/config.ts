export interface ServerConfig {
  mongodbUri: string;
  mongodbTimeout: number;
  schemaSampleSize: number;
  readOnly: boolean;
  disabledTools: string[];
}
export const DEFAULT_CONFIG: Omit<ServerConfig, 'mongodbUri'> = {
  mongodbTimeout: 30000,
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
  currentConfig = {
    mongodbUri,
    mongodbTimeout: parseInt(process.env.MONGODB_TIMEOUT || '', 10) || DEFAULT_CONFIG.mongodbTimeout,
    schemaSampleSize: parseInt(process.env.SCHEMA_SAMPLE_SIZE || '', 10) || DEFAULT_CONFIG.schemaSampleSize,
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
