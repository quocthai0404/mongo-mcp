import { z } from 'zod';
import { Db } from 'mongodb';
export const DELETE_MANY_TOOL_NAME = 'delete_many';
export const DELETE_MANY_TOOL_DESCRIPTION =
    'Delete multiple documents from a MongoDB collection. For safety, requires confirm=true to execute. First call without confirm to preview how many documents will be deleted.';
export const deleteManyInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    filter: z.record(z.any()).describe('Filter to select documents to delete. Use {} to delete all documents (dangerous!)'),
    confirm: z.boolean().optional().default(false).describe('Set to true to confirm and execute the deletion')
});
export type DeleteManyInput = z.infer<typeof deleteManyInputSchema>;
export interface DeleteManyOutput {
    success: boolean;
    collection: string;
    deletedCount: number;
    acknowledged: boolean;
    preview: boolean;
    matchedCount?: number;
}
export async function executeDeleteMany(db: Db, input: DeleteManyInput): Promise<DeleteManyOutput> {
    const collection = db.collection(input.collection);

    const isEmptyFilter = Object.keys(input.filter).length === 0;

    if (!input.confirm) {
        const matchedCount = await collection.countDocuments(input.filter);
        return {
            success: true,
            collection: input.collection,
            deletedCount: 0,
            acknowledged: true,
            preview: true,
            matchedCount
        };
    }

    const result = await collection.deleteMany(input.filter);
    return {
        success: result.acknowledged,
        collection: input.collection,
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged,
        preview: false
    };
}
export function formatDeleteManyResponse(output: DeleteManyOutput): string {
    if (output.preview) {
        if (output.matchedCount && output.matchedCount > 0) {
            const warning = output.matchedCount > 100
                ? '\n\n🔴 **WARNING**: This will delete a large number of documents!'
                : '';
            return `⚠️ **Delete Preview** for '${output.collection}'\n\n` +
                `Found **${output.matchedCount.toLocaleString()}** document(s) matching the filter.${warning}\n\n` +
                `🔴 To confirm deletion, call delete_many again with \`confirm: true\``;
        } else {
            return `ℹ️ No documents match the filter in '${output.collection}'. Nothing to delete.`;
        }
    }
    if (output.success && output.deletedCount > 0) {
        return `✅ Deleted **${output.deletedCount.toLocaleString()}** document(s) from '${output.collection}'`;
    } else if (output.deletedCount === 0) {
        return `ℹ️ No documents matched the filter in '${output.collection}'. Nothing was deleted.`;
    }
    return `❌ Failed to delete documents from '${output.collection}'`;
}
