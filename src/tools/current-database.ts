import { z } from 'zod';
import { ConnectionManager } from '../db/connection.js';
export const CURRENT_DATABASE_TOOL_NAME = 'current_database';
export const CURRENT_DATABASE_TOOL_DESCRIPTION =
    'Show the current database being used for operations.';
export const currentDatabaseInputSchema = z.object({});
export interface CurrentDatabaseOutput {
    database: string | null;
    message: string;
}
export async function executeCurrentDatabase(
    connectionManager: ConnectionManager
): Promise<CurrentDatabaseOutput> {
    const dbName = connectionManager.getCurrentDatabaseName();
    return {
        database: dbName,
        message: dbName
            ? `Current database: ${dbName}`
            : 'No database selected. Use list_databases to see available databases, then use_database to select one.'
    };
}
export function formatCurrentDatabaseResponse(output: CurrentDatabaseOutput): string {
    if (output.database) {
        return `📁 Current database: **${output.database}**`;
    }
    return `⚠️ ${output.message}`;
}
