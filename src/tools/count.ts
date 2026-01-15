import { z } from 'zod';
import { Db } from 'mongodb';
export const COUNT_TOOL_NAME = 'count';
export const COUNT_TOOL_DESCRIPTION =
    'Count the number of documents in a MongoDB collection that match a filter.';
export const countInputSchema = z.object({
    collection: z.string().describe('Name of the collection to count'),
    filter: z.record(z.any()).optional().default({}).describe('MongoDB query filter (optional)')
});
export type CountInput = z.infer<typeof countInputSchema>;
export interface CountOutput {
    collection: string;
    filter: Record<string, unknown>;
    count: number;
}
export async function executeCount(db: Db, input: CountInput): Promise<CountOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }
    const count = await collection.countDocuments(input.filter || {});
    return {
        collection: input.collection,
        filter: input.filter || {},
        count
    };
}
export function formatCountResponse(output: CountOutput): string {
    const lines: string[] = [
        `📊 Count: **${output.count.toLocaleString()}** document(s) in '${output.collection}'`
    ];
    if (Object.keys(output.filter).length > 0) {
        lines.push(`🔍 Filter: ${JSON.stringify(output.filter)}`);
    }
    return lines.join('\n');
}
