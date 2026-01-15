export type BsonTypeName =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'null'
  | 'undefined'
  | 'ObjectId'
  | 'Date'
  | 'Binary'
  | 'Long'
  | 'Decimal128'
  | 'Timestamp'
  | 'Object'
  | 'Array';
export interface IndexInfo {
  name: string;
  keys: Record<string, 1 | -1>;
  unique?: boolean | undefined;
  sparse?: boolean | undefined;
}
export interface CollectionInfo {
  name: string;
  documentCount: number;
  indexes: IndexInfo[];
  avgDocumentSize?: number | undefined;
}
export interface FieldInfo {
  path: string;
  types: BsonTypeName[];
  frequency: number;
  enumValues?: unknown[] | undefined;
  isPolymorphic?: boolean | undefined;
}
export interface Schema {
  collection: string;
  documentCount: number;
  sampleSize: number;
  fields: Record<string, FieldInfo>;
  generatedAt: string;
}
export interface SampleDocument {
  _id: string;
  [key: string]: unknown;
}
export interface SampleDataResult {
  collection: string;
  documentCount: number;
  sampleSize: number;
  documents: SampleDocument[];
  query?: object | undefined;
}
export interface QueryValidationResult {
  valid: boolean;
  error?: string | undefined;
  warnings?: string[] | undefined;
}
export interface CollectionSummary {
  name: string;
  documentCount: number;
  indexCount: number;
  avgDocSize?: number | undefined;
}
export interface SchemaOverview {
  database: string;
  collections: CollectionSummary[];
  generatedAt: string;
}
