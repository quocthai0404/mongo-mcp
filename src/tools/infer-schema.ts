import { z } from 'zod';
import { Db } from 'mongodb';
import { Schema } from '../types/schema.js';
import { inferSchema, listUserCollections } from '../services/schema-inference.js';
export const INFER_SCHEMA_TOOL_NAME = 'infer_schema';
export const INFER_SCHEMA_TOOL_DESCRIPTION =
  'Analyzes documents in a collection to infer field names, data types, nullability, and enum values. Uses sampling for efficiency - does not scan entire collection.';
export const MAX_SAMPLE_SIZE = 5000;
export const DEFAULT_SAMPLE_SIZE = 1000;
export const inferSchemaInputSchema = z.object({
  collection_name: z
    .string()
    .min(1)
    .describe('Name of the MongoDB collection to analyze'),
  sample_size: z
    .number()
    .int()
    .min(1)
    .max(MAX_SAMPLE_SIZE)
    .optional()
    .describe(`Number of documents to sample (default: ${DEFAULT_SAMPLE_SIZE}, max: ${MAX_SAMPLE_SIZE})`),
});
export type InferSchemaInput = z.infer<typeof inferSchemaInputSchema>;
export async function executeInferSchema(
  db: Db,
  input: InferSchemaInput
): Promise<Schema> {
  const { collection_name, sample_size = DEFAULT_SAMPLE_SIZE } = input;
  const collections = await listUserCollections(db);
  if (!collections.includes(collection_name)) {
    throw new Error(`Collection '${collection_name}' not found in database`);
  }
  return await inferSchema(db, collection_name, Math.min(sample_size, MAX_SAMPLE_SIZE));
}
export function formatInferSchemaResponse(schema: Schema): string {
  const compactFields: Record<string, {
    types: string[];
    frequency: number;
    enumValues?: unknown[];
    isPolymorphic?: boolean;
  }> = {};
  for (const [path, fieldInfo] of Object.entries(schema.fields)) {
    compactFields[path] = {
      types: fieldInfo.types,
      frequency: fieldInfo.frequency,
    };
    if (fieldInfo.enumValues) {
      compactFields[path].enumValues = fieldInfo.enumValues;
    }
    if (fieldInfo.isPolymorphic) {
      compactFields[path].isPolymorphic = true;
    }
  }
  return JSON.stringify({
    collection: schema.collection,
    documentCount: schema.documentCount,
    sampleSize: schema.sampleSize,
    fields: compactFields,
    generatedAt: schema.generatedAt,
  });
}
