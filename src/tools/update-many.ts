import { z } from 'zod';
import { Db } from 'mongodb';
export const UPDATE_MANY_TOOL_NAME = 'update_many';
export const UPDATE_MANY_TOOL_DESCRIPTION =
    'Update multiple documents in a MongoDB collection that match a filter. Supports $set, $unset, $inc, $push, and other update operators.';
export const updateManyInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    filter: z.record(z.any()).describe('Filter to select documents to update'),
    update: z.record(z.any()).describe('Update operations to apply (e.g., { $set: { field: value } })'),
    upsert: z.boolean().optional().default(false).describe('If true, create a new document if no match is found')
});
export type UpdateManyInput = z.infer<typeof updateManyInputSchema>;
export interface UpdateManyOutput {
    success: boolean;
    collection: string;
    matchedCount: number;
    modifiedCount: number;
    upsertedId: string | null;
    acknowledged: boolean;
}
export async function executeUpdateMany(db: Db, input: UpdateManyInput): Promise<UpdateManyOutput> {
    const collection = db.collection(input.collection);

    const updateKeys = Object.keys(input.update);
    const hasOperators = updateKeys.some(key => key.startsWith('$'));
    if (!hasOperators) {
        throw new Error('Update must contain MongoDB update operators (e.g., $set, $unset, $inc). Did you mean { $set: ' + JSON.stringify(input.update) + ' }?');
    }
    const result = await collection.updateMany(input.filter, input.update, {
        upsert: input.upsert
    });
    return {
        success: result.acknowledged,
        collection: input.collection,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId?.toString() || null,
        acknowledged: result.acknowledged
    };
}
export function formatUpdateManyResponse(output: UpdateManyOutput): string {
    const lines: string[] = [];
    if (output.success) {
        if (output.upsertedId) {
            lines.push(`✅ Upserted new document in '${output.collection}'`);
            lines.push(`**Upserted ID:** \`${output.upsertedId}\``);
        } else if (output.modifiedCount > 0) {
            lines.push(`✅ Updated ${output.modifiedCount} of ${output.matchedCount} matched document(s) in '${output.collection}'`);
        } else if (output.matchedCount > 0) {
            lines.push(`ℹ️ Matched ${output.matchedCount} document(s) but no changes were made (values may be the same)`);
        } else {
            lines.push(`⚠️ No documents matched the filter in '${output.collection}'`);
        }
    } else {
        lines.push(`❌ Failed to update documents in '${output.collection}'`);
    }
    return lines.join('\n');
}
