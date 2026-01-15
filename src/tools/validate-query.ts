import { z } from 'zod';
import { Db } from 'mongodb';
import { QueryValidationResult } from '../types/schema.js';
import { validateQuery as validateQueryService } from '../services/query-validator.js';
import { listUserCollections } from '../services/schema-inference.js';
export const VALIDATE_QUERY_TOOL_NAME = 'validate_query';
export const VALIDATE_QUERY_TOOL_DESCRIPTION =
  'Validates MongoDB query syntax without executing it. Checks JSON validity, operator syntax, and optionally verifies collection existence. Use this before suggesting queries to users.';
export const validateQueryInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('MongoDB query as a JSON string'),
  collection_name: z
    .string()
    .optional()
    .describe('Optional collection name to verify existence'),
});
export type ValidateQueryInput = z.infer<typeof validateQueryInputSchema>;
export interface ValidateQueryOutput extends QueryValidationResult {
  parsedQuery?: object;
}
export async function executeValidateQuery(
  db: Db,
  input: ValidateQueryInput
): Promise<ValidateQueryOutput> {
  const { query, collection_name } = input;
  let collectionExists: boolean | undefined;
  if (collection_name) {
    const collections = await listUserCollections(db);
    collectionExists = collections.includes(collection_name);
  }
  const result = validateQueryService(query, collectionExists, collection_name);
  if (result.valid) {
    try {
      const { EJSON } = await import('bson');
      const parsedQuery = EJSON.parse(query);
      return {
        ...result,
        parsedQuery,
      };
    } catch {
      return result;
    }
  }
  return result;
}
export function formatValidateQueryResponse(result: ValidateQueryOutput): string {
  return JSON.stringify(result);
}
