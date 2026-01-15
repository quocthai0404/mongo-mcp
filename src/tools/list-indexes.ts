import { z } from 'zod';
import { Db } from 'mongodb';
export const LIST_INDEXES_TOOL_NAME = 'list_indexes';
export const LIST_INDEXES_TOOL_DESCRIPTION =
    'List all indexes for a MongoDB collection. Shows index name, keys, and properties.';
export const listIndexesInputSchema = z.object({
    collection: z.string().describe('Name of the collection')
});
export type ListIndexesInput = z.infer<typeof listIndexesInputSchema>;
export interface IndexInfo {
    name: string;
    keys: Record<string, number>;
    unique: boolean;
    sparse: boolean;
    background: boolean;
    expireAfterSeconds?: number;
}
export interface ListIndexesOutput {
    collection: string;
    indexes: IndexInfo[];
    count: number;
}
export async function executeListIndexes(db: Db, input: ListIndexesInput): Promise<ListIndexesOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }
    const indexCursor = collection.listIndexes();
    const rawIndexes = await indexCursor.toArray();
    const indexes: IndexInfo[] = rawIndexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false,
        background: idx.background || false,
        expireAfterSeconds: idx.expireAfterSeconds
    }));
    return {
        collection: input.collection,
        indexes,
        count: indexes.length
    };
}
export function formatListIndexesResponse(output: ListIndexesOutput): string {
    const lines: string[] = [
        `📑 Found ${output.count} index(es) on '${output.collection}'`,
        ''
    ];
    for (const idx of output.indexes) {
        const keyStr = Object.entries(idx.keys)
            .map(([k, v]) => `${k}: ${v === 1 ? 'ASC' : v === -1 ? 'DESC' : v}`)
            .join(', ');
        const flags: string[] = [];
        if (idx.unique) flags.push('UNIQUE');
        if (idx.sparse) flags.push('SPARSE');
        if (idx.expireAfterSeconds !== undefined) flags.push(`TTL:${idx.expireAfterSeconds}s`);
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        lines.push(`  • **${idx.name}**: { ${keyStr} }${flagStr}`);
    }
    return lines.join('\n');
}
