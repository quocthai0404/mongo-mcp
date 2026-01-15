import { z } from 'zod';
import { Db } from 'mongodb';
import { ConnectionManager } from '../db/connection.js';
export const USE_DATABASE_TOOL_NAME = 'use_database';
export const USE_DATABASE_TOOL_DESCRIPTION =
    'Switch to a specific database to work with. All subsequent operations will use this database.';
export const useDatabaseInputSchema = z.object({
    database: z.string().describe('Name of the database to use')
});
export type UseDatabaseInput = z.infer<typeof useDatabaseInputSchema>;
export interface UseDatabaseOutput {
    success: boolean;
    database: string;
    message: string;
}
export async function executeUseDatabase(
    connectionManager: ConnectionManager,
    input: UseDatabaseInput
): Promise<UseDatabaseOutput> {
    const db = connectionManager.useDatabase(input.database);

    const collections = await db.listCollections().toArray();
    return {
        success: true,
        database: input.database,
        message: `Successfully switched to database: ${input.database} (${collections.length} collections)`
    };
}
export function formatUseDatabaseResponse(output: UseDatabaseOutput): string {
    if (output.success) {
        return `✅ ${output.message}\n\nYou can now use list_collections, infer_schema, sample_data, and other tools on this database.`;
    }
    return `❌ Failed to switch database: ${output.message}`;
}
