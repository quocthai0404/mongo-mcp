import { z } from 'zod';
import { Db, Document } from 'mongodb';
export const INSERT_MANY_TOOL_NAME = 'insert_many';
export const INSERT_MANY_TOOL_DESCRIPTION =
    'Insert multiple documents into a MongoDB collection. Returns the count and IDs of inserted documents.';
export const insertManyInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    documents: z.array(z.record(z.any())).describe('Array of documents to insert'),
    ordered: z.boolean().optional().default(true).describe('If true, stop on first error. If false, continue inserting remaining documents.')
});
export type InsertManyInput = z.infer<typeof insertManyInputSchema>;
export interface InsertManyOutput {
    success: boolean;
    collection: string;
    insertedCount: number;
    insertedIds: string[];
    acknowledged: boolean;
}
export async function executeInsertMany(db: Db, input: InsertManyInput): Promise<InsertManyOutput> {
    const collection = db.collection(input.collection);
    if (input.documents.length === 0) {
        throw new Error('No documents provided to insert');
    }
    const result = await collection.insertMany(input.documents as Document[], {
        ordered: input.ordered
    });
    return {
        success: result.acknowledged,
        collection: input.collection,
        insertedCount: result.insertedCount,
        insertedIds: Object.values(result.insertedIds).map(id => id.toString()),
        acknowledged: result.acknowledged
    };
}
export function formatInsertManyResponse(output: InsertManyOutput): string {
    if (output.success) {
        const lines = [
            `✅ Successfully inserted ${output.insertedCount} document(s) into '${output.collection}'`,
            ''
        ];
        if (output.insertedCount <= 10) {
            lines.push('**Inserted IDs:**');
            output.insertedIds.forEach(id => lines.push(`  • \`${id}\``));
        } else {
            lines.push(`**Inserted IDs:** ${output.insertedCount} documents (too many to list)`);
        }
        return lines.join('\n');
    }
    return `❌ Failed to insert documents into '${output.collection}'`;
}
