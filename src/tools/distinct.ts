import { z } from 'zod';
import { Db } from 'mongodb';
import { maskDocument } from '../services/data-masking.js';
export const DISTINCT_TOOL_NAME = 'distinct';
export const DISTINCT_TOOL_DESCRIPTION =
    'Get all distinct (unique) values for a specific field in a collection.';
export const distinctInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    field: z.string().describe('Field name to get distinct values for'),
    filter: z.record(z.any()).optional().default({}).describe('Optional filter to narrow down documents')
});
export type DistinctInput = z.infer<typeof distinctInputSchema>;
export interface DistinctOutput {
    collection: string;
    field: string;
    values: unknown[];
    count: number;
}
export async function executeDistinct(db: Db, input: DistinctInput): Promise<DistinctOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }
    const values = await collection.distinct(input.field, input.filter || {});

    const maskedValues = values.map(v => {
        if (typeof v === 'object' && v !== null) {
            return maskDocument(v as Record<string, unknown>);
        }
        const sensitiveFieldPatterns = ['password', 'secret', 'token', 'email', 'phone', 'ssn', 'credit'];
        const isSensitiveField = sensitiveFieldPatterns.some(p => input.field.toLowerCase().includes(p));
        if (isSensitiveField && typeof v === 'string') {
            return '[MASKED]';
        }
        return v;
    });
    return {
        collection: input.collection,
        field: input.field,
        values: maskedValues,
        count: maskedValues.length
    };
}
export function formatDistinctResponse(output: DistinctOutput): string {
    const lines: string[] = [
        `🔤 Found ${output.count} distinct value(s) for '${output.field}' in '${output.collection}'`,
        ''
    ];
    if (output.count <= 20) {
        lines.push('```json');
        lines.push(JSON.stringify(output.values, null, 2));
        lines.push('```');
    } else {
        lines.push('First 20 values:');
        lines.push('```json');
        lines.push(JSON.stringify(output.values.slice(0, 20), null, 2));
        lines.push('```');
        lines.push(`... and ${output.count - 20} more`);
    }
    return lines.join('\n');
}
