import { z } from 'zod';
import { Db, IndexDirection } from 'mongodb';
export const CREATE_INDEX_TOOL_NAME = 'create_index';
export const CREATE_INDEX_TOOL_DESCRIPTION =
    'Create a new index on a MongoDB collection. Supports single-field, compound, unique, sparse, and TTL indexes.';
export const createIndexInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    keys: z.record(z.number()).describe('Index keys as { field: 1 } for ASC or { field: -1 } for DESC. Use { field: "text" } for text indexes.'),
    options: z.object({
        name: z.string().optional().describe('Custom name for the index'),
        unique: z.boolean().optional().describe('If true, creates a unique index'),
        sparse: z.boolean().optional().describe('If true, only index documents containing the field'),
        expireAfterSeconds: z.number().optional().describe('TTL in seconds for TTL indexes'),
        background: z.boolean().optional().describe('If true, build index in background (deprecated in MongoDB 4.2+)')
    }).optional().default({})
});
export type CreateIndexInput = z.infer<typeof createIndexInputSchema>;
export interface CreateIndexOutput {
    success: boolean;
    collection: string;
    indexName: string;
    keys: Record<string, number>;
}
export async function executeCreateIndex(db: Db, input: CreateIndexInput): Promise<CreateIndexOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }

    const indexOptions: Record<string, unknown> = {};
    if (input.options?.name) indexOptions.name = input.options.name;
    if (input.options?.unique) indexOptions.unique = input.options.unique;
    if (input.options?.sparse) indexOptions.sparse = input.options.sparse;
    if (input.options?.expireAfterSeconds !== undefined) indexOptions.expireAfterSeconds = input.options.expireAfterSeconds;
    const indexName = await collection.createIndex(
        input.keys as Record<string, IndexDirection>,
        indexOptions
    );
    return {
        success: true,
        collection: input.collection,
        indexName,
        keys: input.keys
    };
}
export function formatCreateIndexResponse(output: CreateIndexOutput): string {
    const keyStr = Object.entries(output.keys)
        .map(([k, v]) => `${k}: ${v === 1 ? 'ASC' : v === -1 ? 'DESC' : v}`)
        .join(', ');
    return `✅ Created index **'${output.indexName}'** on '${output.collection}'\n\n**Keys:** { ${keyStr} }`;
}
