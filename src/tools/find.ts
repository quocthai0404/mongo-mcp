import { z } from 'zod';
import { Db, Document, FindOptions, Sort } from 'mongodb';
import { maskDocument } from '../services/data-masking.js';
export const FIND_TOOL_NAME = 'find';
export const FIND_TOOL_DESCRIPTION =
    'Query documents from a MongoDB collection with filters, projections, sorting, and pagination. Results are automatically masked for PII protection.';
export const findInputSchema = z.object({
    collection: z.string().describe('Name of the collection to query'),
    filter: z.record(z.any()).optional().default({}).describe('MongoDB query filter (e.g., { "status": "active" })'),
    projection: z.record(z.number()).optional().describe('Fields to include (1) or exclude (0)'),
    sort: z.record(z.number()).optional().describe('Sort order (1 for ascending, -1 for descending)'),
    limit: z.number().optional().default(10).describe('Maximum number of documents to return (default: 10)'),
    skip: z.number().optional().default(0).describe('Number of documents to skip')
});
export type FindInput = z.infer<typeof findInputSchema>;
export interface FindOutput {
    collection: string;
    filter: Record<string, unknown>;
    documents: Document[];
    count: number;
    hasMore: boolean;
}
export async function executeFind(db: Db, input: FindInput): Promise<FindOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }
    const options: FindOptions = {
        limit: input.limit,
        skip: input.skip,
    };
    if (input.projection) {
        options.projection = input.projection;
    }
    if (input.sort) {
        options.sort = input.sort as Sort;
    }
    const cursor = collection.find(input.filter || {}, options);
    const documents = await cursor.toArray();

    const totalCount = await collection.countDocuments(input.filter || {});
    const hasMore = (input.skip || 0) + documents.length < totalCount;

    const maskedDocuments = documents.map(doc => maskDocument(doc));
    return {
        collection: input.collection,
        filter: input.filter || {},
        documents: maskedDocuments,
        count: documents.length,
        hasMore
    };
}
export function formatFindResponse(output: FindOutput): string {
    const lines: string[] = [
        `📄 Found ${output.count} document(s) in '${output.collection}'`,
    ];
    if (Object.keys(output.filter).length > 0) {
        lines.push(`🔍 Filter: ${JSON.stringify(output.filter)}`);
    }
    if (output.hasMore) {
        lines.push(`📑 More documents available (use skip/limit for pagination)`);
    }
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(output.documents, null, 2));
    lines.push('```');
    return lines.join('\n');
}
