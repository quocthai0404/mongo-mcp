import { z } from 'zod';
import { Db } from 'mongodb';
export const DROP_INDEX_TOOL_NAME = 'drop_index';
export const DROP_INDEX_TOOL_DESCRIPTION =
    'Drop an index from a MongoDB collection. For safety, requires confirm=true. Cannot drop the _id index.';
export const dropIndexInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    indexName: z.string().describe('Name of the index to drop'),
    confirm: z.boolean().optional().default(false).describe('Set to true to confirm and execute the drop')
});
export type DropIndexInput = z.infer<typeof dropIndexInputSchema>;
export interface DropIndexOutput {
    success: boolean;
    collection: string;
    indexName: string;
    preview: boolean;
    indexExists?: boolean;
}
export async function executeDropIndex(db: Db, input: DropIndexInput): Promise<DropIndexOutput> {
    const collection = db.collection(input.collection);

    if (input.indexName === '_id_') {
        throw new Error('Cannot drop the _id index');
    }

    const indexCursor = collection.listIndexes();
    const indexes = await indexCursor.toArray();
    const indexExists = indexes.some(idx => idx.name === input.indexName);

    if (!input.confirm) {
        return {
            success: true,
            collection: input.collection,
            indexName: input.indexName,
            preview: true,
            indexExists
        };
    }
    if (!indexExists) {
        throw new Error(`Index '${input.indexName}' does not exist on collection '${input.collection}'`);
    }

    await collection.dropIndex(input.indexName);
    return {
        success: true,
        collection: input.collection,
        indexName: input.indexName,
        preview: false
    };
}
export function formatDropIndexResponse(output: DropIndexOutput): string {
    if (output.preview) {
        if (output.indexExists) {
            return `⚠️ **Drop Index Preview**\n\n` +
                `Index **'${output.indexName}'** exists on '${output.collection}'.\n\n` +
                `🔴 To confirm, call drop_index again with \`confirm: true\``;
        } else {
            return `❌ Index **'${output.indexName}'** does not exist on '${output.collection}'`;
        }
    }
    if (output.success) {
        return `✅ Dropped index **'${output.indexName}'** from '${output.collection}'`;
    }
    return `❌ Failed to drop index '${output.indexName}'`;
}
