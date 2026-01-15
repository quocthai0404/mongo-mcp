import { z } from 'zod';
import { Db, Document } from 'mongodb';
import { maskDocument } from '../services/data-masking.js';
export const AGGREGATE_TOOL_NAME = 'aggregate';
export const AGGREGATE_TOOL_DESCRIPTION =
    'Execute a MongoDB aggregation pipeline on a collection. Supports all pipeline stages ($match, $group, $sort, $project, $lookup, etc.)';
export const aggregateInputSchema = z.object({
    collection: z.string().describe('Name of the collection to aggregate'),
    pipeline: z.array(z.record(z.any())).describe('Array of aggregation pipeline stages'),
    limit: z.number().optional().default(100).describe('Maximum number of results to return (default: 100)')
});
export type AggregateInput = z.infer<typeof aggregateInputSchema>;
export interface AggregateOutput {
    collection: string;
    pipeline: Record<string, unknown>[];
    results: Document[];
    count: number;
}
export async function executeAggregate(db: Db, input: AggregateInput): Promise<AggregateOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }

    const pipeline = [...input.pipeline];
    const hasLimit = pipeline.some(stage => '$limit' in stage);
    if (!hasLimit && input.limit) {
        pipeline.push({ $limit: input.limit });
    }
    const cursor = collection.aggregate(pipeline);
    const results = await cursor.toArray();

    const maskedResults = results.map(doc => maskDocument(doc));
    return {
        collection: input.collection,
        pipeline: input.pipeline,
        results: maskedResults,
        count: maskedResults.length
    };
}
export function formatAggregateResponse(output: AggregateOutput): string {
    const lines: string[] = [
        `📊 Aggregation on '${output.collection}' returned ${output.count} result(s)`,
        '',
        '**Pipeline:**',
        '```json',
        JSON.stringify(output.pipeline, null, 2),
        '```',
        '',
        '**Results:**',
        '```json',
        JSON.stringify(output.results, null, 2),
        '```'
    ];
    return lines.join('\n');
}
