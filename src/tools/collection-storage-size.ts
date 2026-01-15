import { z } from 'zod';
import { Db } from 'mongodb';
export const COLLECTION_STORAGE_SIZE_TOOL_NAME = 'collection_storage_size';
export const COLLECTION_STORAGE_SIZE_TOOL_DESCRIPTION =
    'Get storage size and statistics for a MongoDB collection.';
export const collectionStorageSizeInputSchema = z.object({
    collection: z.string().describe('Name of the collection')
});
export type CollectionStorageSizeInput = z.infer<typeof collectionStorageSizeInputSchema>;
export interface CollectionStorageSizeOutput {
    collection: string;
    count: number;
    size: number;
    avgObjSize: number;
    storageSize: number;
    totalIndexSize: number;
    nindexes: number;
}
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export async function executeCollectionStorageSize(db: Db, input: CollectionStorageSizeInput): Promise<CollectionStorageSizeOutput> {
    const existing = await db.listCollections({ name: input.collection }).toArray();
    if (existing.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }

    const stats = await db.command({ collStats: input.collection });
    return {
        collection: input.collection,
        count: stats.count || 0,
        size: stats.size || 0,
        avgObjSize: stats.avgObjSize || 0,
        storageSize: stats.storageSize || 0,
        totalIndexSize: stats.totalIndexSize || 0,
        nindexes: stats.nindexes || 0
    };
}
export function formatCollectionStorageSizeResponse(output: CollectionStorageSizeOutput): string {
    const lines: string[] = [
        `📊 Storage Stats for **'${output.collection}'**`,
        '',
        '**Documents:**',
        `  • Count: ${output.count.toLocaleString()}`,
        `  • Data size: ${formatBytes(output.size)}`,
        `  • Avg document size: ${formatBytes(output.avgObjSize)}`,
        '',
        '**Storage:**',
        `  • Storage size: ${formatBytes(output.storageSize)}`,
        '',
        '**Indexes:**',
        `  • Index count: ${output.nindexes}`,
        `  • Total index size: ${formatBytes(output.totalIndexSize)}`
    ];
    return lines.join('\n');
}
