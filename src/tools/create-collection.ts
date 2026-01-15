import { z } from 'zod';
import { Db } from 'mongodb';
export const CREATE_COLLECTION_TOOL_NAME = 'create_collection';
export const CREATE_COLLECTION_TOOL_DESCRIPTION =
    'Create a new collection in the MongoDB database. Optionally configure as capped collection.';
export const createCollectionInputSchema = z.object({
    collection: z.string().describe('Name of the collection to create'),
    options: z.object({
        capped: z.boolean().optional().describe('If true, creates a capped collection'),
        size: z.number().optional().describe('Maximum size in bytes for capped collection'),
        max: z.number().optional().describe('Maximum number of documents for capped collection')
    }).optional().default({})
});
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;
export interface CreateCollectionOutput {
    success: boolean;
    collection: string;
    capped: boolean;
}
export async function executeCreateCollection(db: Db, input: CreateCollectionInput): Promise<CreateCollectionOutput> {
    const existing = await db.listCollections({ name: input.collection }).toArray();
    if (existing.length > 0) {
        throw new Error(`Collection '${input.collection}' already exists`);
    }
    const options: Record<string, unknown> = {};
    if (input.options?.capped) {
        options.capped = true;
        options.size = input.options.size || 10485760; // Default 10MB
        if (input.options.max) options.max = input.options.max;
    }
    await db.createCollection(input.collection, options);
    return {
        success: true,
        collection: input.collection,
        capped: input.options?.capped || false
    };
}
export function formatCreateCollectionResponse(output: CreateCollectionOutput): string {
    const cappedStr = output.capped ? ' (capped)' : '';
    return `✅ Created collection **'${output.collection}'**${cappedStr}`;
}
