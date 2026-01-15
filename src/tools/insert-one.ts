import { z } from 'zod';
import { Db, Document } from 'mongodb';
export const INSERT_ONE_TOOL_NAME = 'insert_one';
export const INSERT_ONE_TOOL_DESCRIPTION =
    'Insert a single document into a MongoDB collection. Returns the inserted document ID.';
export const insertOneInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    document: z.record(z.any()).describe('Document to insert')
});
export type InsertOneInput = z.infer<typeof insertOneInputSchema>;
export interface InsertOneOutput {
    success: boolean;
    collection: string;
    insertedId: string;
    acknowledged: boolean;
}
export async function executeInsertOne(db: Db, input: InsertOneInput): Promise<InsertOneOutput> {
    const collection = db.collection(input.collection);
    const result = await collection.insertOne(input.document as Document);
    return {
        success: result.acknowledged,
        collection: input.collection,
        insertedId: result.insertedId.toString(),
        acknowledged: result.acknowledged
    };
}
export function formatInsertOneResponse(output: InsertOneOutput): string {
    if (output.success) {
        return `✅ Successfully inserted document into '${output.collection}'\n\n**Inserted ID:** \`${output.insertedId}\``;
    }
    return `❌ Failed to insert document into '${output.collection}'`;
}
