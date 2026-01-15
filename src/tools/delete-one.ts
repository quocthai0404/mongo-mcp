import { z } from 'zod';
import { Db } from 'mongodb';
export const DELETE_ONE_TOOL_NAME = 'delete_one';
export const DELETE_ONE_TOOL_DESCRIPTION =
    'Delete a single document from a MongoDB collection. For safety, requires confirm=true to execute. First call without confirm to preview, then call with confirm=true to execute.';
export const deleteOneInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    filter: z.record(z.any()).describe('Filter to select the document to delete'),
    confirm: z.boolean().optional().default(false).describe('Set to true to confirm and execute the deletion')
});
export type DeleteOneInput = z.infer<typeof deleteOneInputSchema>;
export interface DeleteOneOutput {
    success: boolean;
    collection: string;
    deletedCount: number;
    acknowledged: boolean;
    preview: boolean;
    matchedCount?: number;
}
export async function executeDeleteOne(db: Db, input: DeleteOneInput): Promise<DeleteOneOutput> {
    const collection = db.collection(input.collection);

    if (!input.confirm) {
        const matchedCount = await collection.countDocuments(input.filter, { limit: 1 });
        return {
            success: true,
            collection: input.collection,
            deletedCount: 0,
            acknowledged: true,
            preview: true,
            matchedCount
        };
    }

    const result = await collection.deleteOne(input.filter);
    return {
        success: result.acknowledged,
        collection: input.collection,
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged,
        preview: false
    };
}
export function formatDeleteOneResponse(output: DeleteOneOutput): string {
    if (output.preview) {
        if (output.matchedCount && output.matchedCount > 0) {
            return `⚠️ **Delete Preview** for '${output.collection}'\n\n` +
                `Found ${output.matchedCount} document(s) matching the filter.\n\n` +
                `🔴 To confirm deletion, call delete_one again with \`confirm: true\``;
        } else {
            return `ℹ️ No documents match the filter in '${output.collection}'. Nothing to delete.`;
        }
    }
    if (output.success && output.deletedCount > 0) {
        return `✅ Deleted ${output.deletedCount} document(s) from '${output.collection}'`;
    } else if (output.deletedCount === 0) {
        return `ℹ️ No documents matched the filter in '${output.collection}'. Nothing was deleted.`;
    }
    return `❌ Failed to delete document from '${output.collection}'`;
}
