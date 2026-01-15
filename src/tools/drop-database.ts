import { z } from 'zod';
import { Db } from 'mongodb';
export const DROP_DATABASE_TOOL_NAME = 'drop_database';
export const DROP_DATABASE_TOOL_DESCRIPTION =
    'Drop the entire MongoDB database. EXTREME CAUTION: This permanently deletes the database and ALL its data! Requires confirm=true.';
export const dropDatabaseInputSchema = z.object({
    confirm: z.boolean().optional().default(false).describe('Set to true to confirm and execute the drop')
});
export type DropDatabaseInput = z.infer<typeof dropDatabaseInputSchema>;
export interface DropDatabaseOutput {
    success: boolean;
    database: string;
    preview: boolean;
    collectionCount?: number;
}
export async function executeDropDatabase(db: Db, input: DropDatabaseInput): Promise<DropDatabaseOutput> {
    const databaseName = db.databaseName;

    if (!input.confirm) {
        const collections = await db.listCollections().toArray();
        return {
            success: true,
            database: databaseName,
            preview: true,
            collectionCount: collections.length
        };
    }

    await db.dropDatabase();
    return {
        success: true,
        database: databaseName,
        preview: false
    };
}
export function formatDropDatabaseResponse(output: DropDatabaseOutput): string {
    if (output.preview) {
        return `🔴 **DROP DATABASE Preview**\n\n` +
            `Database **'${output.database}'** contains **${output.collectionCount}** collection(s).\n\n` +
            `⚠️ **EXTREME WARNING**: This will permanently delete the ENTIRE DATABASE and ALL its collections!\n\n` +
            `To confirm, call drop_database with \`confirm: true\``;
    }
    if (output.success) {
        return `✅ Dropped database **'${output.database}'**`;
    }
    return `❌ Failed to drop database '${output.database}'`;
}
