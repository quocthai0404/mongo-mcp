import { z } from 'zod';
import { MongoClient } from 'mongodb';
export const LIST_DATABASES_TOOL_NAME = 'list_databases';
export const LIST_DATABASES_TOOL_DESCRIPTION =
    'List all available databases in the MongoDB cluster. Use this to discover databases before selecting one with use_database.';
export const listDatabasesInputSchema = z.object({});
export interface DatabaseInfo {
    name: string;
    sizeOnDisk: number;
    empty: boolean;
}
export interface ListDatabasesOutput {
    databases: DatabaseInfo[];
    totalSize: number;
}
export async function executeListDatabases(client: MongoClient): Promise<ListDatabasesOutput> {
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    return {
        databases: result.databases.map(db => ({
            name: db.name,
            sizeOnDisk: db.sizeOnDisk || 0,
            empty: db.empty || false
        })),
        totalSize: result.totalSize || 0
    };
}
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export function formatListDatabasesResponse(output: ListDatabasesOutput): string {
    const lines: string[] = [
        `Found ${output.databases.length} databases (Total: ${formatBytes(output.totalSize)}):`,
        ''
    ];
    for (const db of output.databases) {
        const sizeStr = formatBytes(db.sizeOnDisk);
        const emptyStr = db.empty ? ' (empty)' : '';
        lines.push(`  • ${db.name} - ${sizeStr}${emptyStr}`);
    }
    lines.push('');
    lines.push('💡 Use use_database(database_name) to select a database to work with.');
    return lines.join('\n');
}
