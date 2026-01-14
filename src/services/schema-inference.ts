import { Collection, Db, Document } from 'mongodb';
import { ObjectId, Binary, Long, Decimal128, Timestamp } from 'bson';
import {
  BsonTypeName,
  CollectionInfo,
  IndexInfo,
  Schema,
  FieldInfo,
  CollectionSummary,
} from '../types/schema.js';

interface FieldStats {
  path: string;
  types: Map<string, number>;
  totalCount: number;
  values: Set<unknown>;
}

const ENUM_MAX_VALUES = 20;
const ENUM_MIN_OCCURRENCES = 10;
const ENUM_MAX_CARDINALITY_RATIO = 0.1;

export function inferBsonType(value: unknown): BsonTypeName {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value instanceof ObjectId) return 'ObjectId';
  if (value instanceof Date) return 'Date';
  if (value instanceof Binary) return 'Binary';
  if (value instanceof Timestamp) return 'Timestamp';
  if (value instanceof Long) return 'Long';
  if (value instanceof Decimal128) return 'Decimal128';
  if (Array.isArray(value)) return 'Array';
  if (typeof value === 'object') return 'Object';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'number') return 'Number';
  if (typeof value === 'boolean') return 'Boolean';
  return 'undefined';
}

export async function getIndexInfo(collection: Collection): Promise<IndexInfo[]> {
  const indexes = await collection.indexes();
  return indexes.map((idx) => ({
    name: idx.name || '_unnamed_',
    keys: idx.key as Record<string, 1 | -1>,
    unique: idx.unique,
    sparse: idx.sparse,
  }));
}

export async function getCollectionStats(
  db: Db,
  collectionName: string
): Promise<{ documentCount: number; avgDocumentSize?: number }> {
  try {
    const stats = await db.command({ collStats: collectionName });
    return {
      documentCount: stats.count || 0,
      avgDocumentSize: stats.avgObjSize,
    };
  } catch {
    const collection = db.collection(collectionName);
    const count = await collection.estimatedDocumentCount();
    return { documentCount: count };
  }
}

export async function getCollectionInfo(
  db: Db,
  collectionName: string
): Promise<CollectionInfo> {
  const collection = db.collection(collectionName);
  const [indexes, stats] = await Promise.all([
    getIndexInfo(collection),
    getCollectionStats(db, collectionName),
  ]);

  return {
    name: collectionName,
    documentCount: stats.documentCount,
    indexes,
    avgDocumentSize: stats.avgDocumentSize,
  };
}

export async function getCollectionSummary(
  db: Db,
  collectionName: string
): Promise<CollectionSummary> {
  const collection = db.collection(collectionName);
  const [indexes, stats] = await Promise.all([
    collection.indexes(),
    getCollectionStats(db, collectionName),
  ]);

  return {
    name: collectionName,
    documentCount: stats.documentCount,
    indexCount: indexes.length,
    avgDocSize: stats.avgDocumentSize,
  };
}

export async function listUserCollections(db: Db): Promise<string[]> {
  const collections = await db.listCollections().toArray();
  return collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();
}

function traverseDocument(
  doc: Document,
  prefix: string,
  stats: Map<string, FieldStats>
): void {
  for (const [key, value] of Object.entries(doc)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const type = inferBsonType(value);

    let fieldStats = stats.get(path);
    if (!fieldStats) {
      fieldStats = {
        path,
        types: new Map(),
        totalCount: 0,
        values: new Set(),
      };
      stats.set(path, fieldStats);
    }

    const typeCount = fieldStats.types.get(type) || 0;
    fieldStats.types.set(type, typeCount + 1);
    fieldStats.totalCount++;

    if (
      (type === 'String' || type === 'Number') &&
      fieldStats.values.size <= ENUM_MAX_VALUES
    ) {
      fieldStats.values.add(value);
    }

    if (type === 'Object' && value !== null) {
      traverseDocument(value as Document, path, stats);
    }
  }
}

function statsToFieldInfo(stats: FieldStats, sampleSize: number): FieldInfo {
  const types = Array.from(stats.types.keys()) as BsonTypeName[];
  const nonNullTypes = types.filter((t) => t !== 'null' && t !== 'undefined');
  const frequency = stats.totalCount / sampleSize;

  const fieldInfo: FieldInfo = {
    path: stats.path,
    types: types.sort(),
    frequency: Math.round(frequency * 100) / 100,
  };

  if (nonNullTypes.length > 1) {
    fieldInfo.isPolymorphic = true;
  }

  if (
    stats.values.size > 0 &&
    stats.values.size <= ENUM_MAX_VALUES &&
    stats.totalCount >= ENUM_MIN_OCCURRENCES &&
    stats.values.size / stats.totalCount < ENUM_MAX_CARDINALITY_RATIO
  ) {
    fieldInfo.enumValues = Array.from(stats.values);
  }

  return fieldInfo;
}

export async function inferSchema(
  db: Db,
  collectionName: string,
  sampleSize: number = 1000
): Promise<Schema> {
  const collection = db.collection(collectionName);
  const stats = await getCollectionStats(db, collectionName);

  const actualSampleSize = Math.min(sampleSize, stats.documentCount);

  let samples: Document[];
  if (stats.documentCount <= sampleSize) {
    samples = await collection.find().toArray();
  } else {
    samples = await collection
      .aggregate([{ $sample: { size: actualSampleSize } }])
      .toArray();
  }

  const fieldStats = new Map<string, FieldStats>();
  for (const doc of samples) {
    traverseDocument(doc, '', fieldStats);
  }

  const fields: Record<string, FieldInfo> = {};
  for (const stats of fieldStats.values()) {
    fields[stats.path] = statsToFieldInfo(stats, samples.length);
  }

  return {
    collection: collectionName,
    documentCount: stats.documentCount,
    sampleSize: samples.length,
    fields,
    generatedAt: new Date().toISOString(),
  };
}
