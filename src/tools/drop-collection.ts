import { z } from 'zod';
import { Db } from 'mongodb';
export const DROP_COLLECTION_TOOL_NAME = 'drop_collection';
export const DROP_COLLECTION_TOOL_DESCRIPTION =
    'Drop a collection from the MongoDB database. WARNING: This permanently deletes all data! Requires confirm=true.';
export const dropCollectionInputSchema = z.object({
    collection: z.string().describe('Name of the collection to drop'),
    confirm: z.boolean().optional().default(false).describe('Set to true to confirm and execute the drop')
});
export type DropCollectionInput = z.infer<typeof dropCollectionInputSchema>;
export interface DropCollectionOutput {
    success: boolean;
    collection: string;
    preview: boolean;
    documentCount?: number;
}
export async function executeDropCollection(db: Db, input: DropCollectionInput): Promise<DropCollectionOutput> {
    const existing = await db.listCollections({ name: input.collection }).toArray();
    if (existing.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }

    if (!input.confirm) {
        const collection = db.collection(input.collection);
        const documentCount = await collection.countDocuments();
        return {
            success: true,
            collection: input.collection,
            preview: true,
            documentCount
        };
    }

    await db.dropCollection(input.collection);
    return {
        success: true,
        collection: input.collection,
        preview: false
    };
}
export function formatDropCollectionResponse(output: DropCollectionOutput): string {
    if (output.preview) {
        return `⚠️ **Drop Collection Preview**\n\n` +
            `Collection **'${output.collection}'** contains **${output.documentCount?.toLocaleString()}** document(s).\n\n` +
            `🔴 **WARNING**: This will permanently delete ALL data!\n\n` +
            `To confirm, call drop_collection again with \`confirm: true\``;
    }
    if (output.success) {
        return `✅ Dropped collection **'${output.collection}'**`;
    }
    return `❌ Failed to drop collection '${output.collection}'`;
}
