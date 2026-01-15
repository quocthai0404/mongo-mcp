import { z } from 'zod';
import { Db } from 'mongodb';
export const DB_STATS_TOOL_NAME = 'db_stats';
export const DB_STATS_TOOL_DESCRIPTION =
    'Get statistics about the current database including size, storage, collections, and objects.';
export const dbStatsInputSchema = z.object({});
export interface DbStatsOutput {
    database: string;
    collections: number;
    objects: number;
    avgObjSize: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
    totalSize: number;
    scaleFactor: number;
}
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export async function executeDbStats(db: Db): Promise<DbStatsOutput> {
    const stats = await db.stats();
    return {
        database: db.databaseName,
        collections: stats.collections || 0,
        objects: stats.objects || 0,
        avgObjSize: stats.avgObjSize || 0,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexes: stats.indexes || 0,
        indexSize: stats.indexSize || 0,
        totalSize: stats.totalSize || (stats.dataSize || 0) + (stats.indexSize || 0),
        scaleFactor: stats.scaleFactor || 1
    };
}
export function formatDbStatsResponse(output: DbStatsOutput): string {
    const lines: string[] = [
        `📈 Database Statistics: **${output.database}**`,
        '',
        '**Collections & Objects:**',
        `  • Collections: ${output.collections}`,
        `  • Objects (documents): ${output.objects.toLocaleString()}`,
        `  • Avg object size: ${formatBytes(output.avgObjSize)}`,
        '',
        '**Storage:**',
        `  • Data size: ${formatBytes(output.dataSize)}`,
        `  • Storage size: ${formatBytes(output.storageSize)}`,
        `  • Total size: ${formatBytes(output.totalSize)}`,
        '',
        '**Indexes:**',
        `  • Index count: ${output.indexes}`,
        `  • Index size: ${formatBytes(output.indexSize)}`,
    ];

    if (output.objects > 0 && output.indexes === 0) {
        lines.push('');
        lines.push('💡 **Tip**: No indexes found. Consider adding indexes to improve query performance.');
    }
    if (output.indexSize > output.dataSize * 0.5 && output.indexes > 5) {
        lines.push('');
        lines.push('⚠️ **Note**: Index size is more than 50% of data size. Consider reviewing unused indexes.');
    }
    return lines.join('\n');
}
