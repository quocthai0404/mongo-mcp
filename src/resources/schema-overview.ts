import { Db } from 'mongodb';
import { SchemaOverview, CollectionSummary } from '../types/schema.js';
import { listUserCollections, getCollectionSummary } from '../services/schema-inference.js';
export const SCHEMA_OVERVIEW_URI = 'mongodb://schema/overview';
export async function generateSchemaOverview(db: Db): Promise<SchemaOverview> {
  const databaseName = db.databaseName;
  const collectionNames = await listUserCollections(db);
  const summaries: CollectionSummary[] = await Promise.all(
    collectionNames.map((name) => getCollectionSummary(db, name))
  );
  return {
    database: databaseName,
    collections: summaries,
    generatedAt: new Date().toISOString(),
  };
}
export function formatSchemaOverviewText(overview: SchemaOverview): string {
  const lines: string[] = [
    `# Database: ${overview.database}`,
    '',
    `Generated: ${overview.generatedAt}`,
    '',
    `## Collections (${overview.collections.length})`,
    '',
  ];
  if (overview.collections.length === 0) {
    lines.push('No collections found.');
  } else {
    lines.push('| Collection | Documents | Indexes | Avg Doc Size |');
    lines.push('|------------|-----------|---------|--------------|');
    for (const col of overview.collections) {
      const avgSize = col.avgDocSize
        ? `${Math.round(col.avgDocSize)} bytes`
        : 'N/A';
      lines.push(`| ${col.name} | ${col.documentCount.toLocaleString()} | ${col.indexCount} | ${avgSize} |`);
    }
  }
  return lines.join('\n');
}
