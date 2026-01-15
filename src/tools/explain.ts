import { z } from 'zod';
import { Db, Document, ExplainVerbosityLike } from 'mongodb';
export const EXPLAIN_TOOL_NAME = 'explain';
export const EXPLAIN_TOOL_DESCRIPTION =
    'Analyze the execution plan of a MongoDB query or aggregation. Useful for understanding performance characteristics and index usage.';
export const explainInputSchema = z.object({
    collection: z.string().describe('Name of the collection'),
    type: z.enum(['find', 'aggregate']).describe('Type of operation to explain'),
    query: z.record(z.any()).optional().default({}).describe('Query filter (for find operations)'),
    pipeline: z.array(z.record(z.any())).optional().describe('Aggregation pipeline (for aggregate operations)'),
    verbosity: z.enum(['queryPlanner', 'executionStats', 'allPlansExecution']).optional().default('executionStats')
        .describe('Level of detail for the explanation')
});
export type ExplainInput = z.infer<typeof explainInputSchema>;
export interface ExplainOutput {
    collection: string;
    type: string;
    queryPlanner: {
        winningPlan: Document;
        rejectedPlans: Document[];
    } | null;
    executionStats: {
        executionSuccess: boolean;
        nReturned: number;
        executionTimeMillis: number;
        totalKeysExamined: number;
        totalDocsExamined: number;
        indexUsed: string | null;
    } | null;
    rawExplain: Document;
}
export async function executeExplain(db: Db, input: ExplainInput): Promise<ExplainOutput> {
    const collection = db.collection(input.collection);

    const collections = await db.listCollections({ name: input.collection }).toArray();
    if (collections.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }
    let explainResult: Document;
    if (input.type === 'find') {
        explainResult = await collection
            .find(input.query || {})
            .explain(input.verbosity as ExplainVerbosityLike);
    } else if (input.type === 'aggregate') {
        if (!input.pipeline || input.pipeline.length === 0) {
            throw new Error('Pipeline is required for aggregate explain');
        }
        explainResult = await collection
            .aggregate(input.pipeline)
            .explain(input.verbosity as ExplainVerbosityLike);
    } else {
        throw new Error(`Unknown operation type: ${input.type}`);
    }

    const queryPlanner = explainResult.queryPlanner || null;
    const executionStats = explainResult.executionStats || null;

    let indexUsed: string | null = null;
    if (queryPlanner?.winningPlan) {
        const winningPlan = queryPlanner.winningPlan;
        if (winningPlan.inputStage?.indexName) {
            indexUsed = winningPlan.inputStage.indexName;
        } else if (winningPlan.indexName) {
            indexUsed = winningPlan.indexName;
        }
    }
    return {
        collection: input.collection,
        type: input.type,
        queryPlanner: queryPlanner ? {
            winningPlan: queryPlanner.winningPlan,
            rejectedPlans: queryPlanner.rejectedPlans || []
        } : null,
        executionStats: executionStats ? {
            executionSuccess: executionStats.executionSuccess ?? true,
            nReturned: executionStats.nReturned ?? 0,
            executionTimeMillis: executionStats.executionTimeMillis ?? 0,
            totalKeysExamined: executionStats.totalKeysExamined ?? 0,
            totalDocsExamined: executionStats.totalDocsExamined ?? 0,
            indexUsed
        } : null,
        rawExplain: explainResult
    };
}
export function formatExplainResponse(output: ExplainOutput): string {
    const lines: string[] = [
        `🔍 Query Explain for '${output.collection}' (${output.type})`,
        ''
    ];
    if (output.executionStats) {
        const stats = output.executionStats;
        lines.push('**Execution Stats:**');
        lines.push(`  • Documents returned: ${stats.nReturned}`);
        lines.push(`  • Execution time: ${stats.executionTimeMillis}ms`);
        lines.push(`  • Keys examined: ${stats.totalKeysExamined}`);
        lines.push(`  • Documents examined: ${stats.totalDocsExamined}`);
        lines.push(`  • Index used: ${stats.indexUsed || 'COLLSCAN (no index)'}`);

        if (stats.totalDocsExamined > stats.nReturned * 10 && stats.nReturned > 0) {
            lines.push('');
            lines.push('⚠️ **Performance Warning**: Examining many more documents than returned. Consider adding an index.');
        }
        if (!stats.indexUsed) {
            lines.push('');
            lines.push('⚠️ **No Index Used**: Query is doing a full collection scan (COLLSCAN).');
        }
        lines.push('');
    }
    if (output.queryPlanner) {
        lines.push('**Winning Plan:**');
        lines.push('```json');
        lines.push(JSON.stringify(output.queryPlanner.winningPlan, null, 2));
        lines.push('```');
    }
    return lines.join('\n');
}
