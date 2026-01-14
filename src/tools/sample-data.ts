import { z } from 'zod';
import { Db, Document, Filter } from 'mongodb';
import { SampleDataResult } from '../types/schema.js';
import { listUserCollections, getCollectionStats } from '../services/schema-inference.js';
import { maskDocuments } from '../services/data-masking.js';

export const SAMPLE_DATA_TOOL_NAME = 'sample_data';

export const SAMPLE_DATA_TOOL_DESCRIPTION =
  'Returns sample documents from a collection. Sensitive fields (emails, passwords, SSN, credit cards, API keys) are automatically masked. Use this to see real data patterns and formats.';

export const MAX_SAMPLE_LIMIT = 20;
export const DEFAULT_SAMPLE_LIMIT = 5;

export const sampleDataInputSchema = z.object({
  collection_name: z
    .string()
    .min(1)
    .describe('Name of the collection to sample from'),
  query: z
    .record(z.unknown())
    .optional()
    .describe('Optional MongoDB query filter to match specific documents'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SAMPLE_LIMIT)
    .optional()
    .describe(`Maximum number of documents to return (default: ${DEFAULT_SAMPLE_LIMIT}, max: ${MAX_SAMPLE_LIMIT})`),
});

export type SampleDataInput = z.infer<typeof sampleDataInputSchema>;

export async function executeSampleData(
  db: Db,
  input: SampleDataInput
): Promise<SampleDataResult> {
  const { collection_name, query, limit = DEFAULT_SAMPLE_LIMIT } = input;

  const collections = await listUserCollections(db);
  if (!collections.includes(collection_name)) {
    throw new Error(`Collection '${collection_name}' not found in database`);
  }

  const collection = db.collection(collection_name);
  const stats = await getCollectionStats(db, collection_name);

  const pipeline: Document[] = [];

  if (query && Object.keys(query).length > 0) {
    pipeline.push({ $match: query as Filter<Document> });
  }

  pipeline.push({ $sample: { size: Math.min(limit, MAX_SAMPLE_LIMIT) } });

  let documents: Document[];
  try {
    documents = await collection.aggregate(pipeline).toArray();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid query filter: ${message}`);
  }

  const maskedDocuments = maskDocuments(documents);

  const result: SampleDataResult = {
    collection: collection_name,
    documentCount: stats.documentCount,
    sampleSize: maskedDocuments.length,
    documents: maskedDocuments.map((doc) => ({
      _id: String(doc._id || ''),
      ...doc,
    })),
  };

  if (query && Object.keys(query).length > 0) {
    result.query = query;
  }

  return result;
}

export function formatSampleDataResponse(result: SampleDataResult): string {
  return JSON.stringify(result);
}
