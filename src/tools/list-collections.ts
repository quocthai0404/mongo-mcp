import { z } from 'zod';
import { Db } from 'mongodb';
import { listUserCollections } from '../services/schema-inference.js';

export const LIST_COLLECTIONS_TOOL_NAME = 'list_collections';

export const LIST_COLLECTIONS_TOOL_DESCRIPTION =
  'Returns a list of all user collections in the database, excluding system collections. Use this to discover available collections before querying.';

export const listCollectionsInputSchema = z.object({});

export interface ListCollectionsOutput {
  collections: string[];
}

export async function executeListCollections(db: Db): Promise<ListCollectionsOutput> {
  const collections = await listUserCollections(db);
  return { collections };
}

export function formatListCollectionsResponse(output: ListCollectionsOutput): string {
  return JSON.stringify(output);
}
