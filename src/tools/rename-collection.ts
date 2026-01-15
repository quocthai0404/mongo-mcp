import { z } from 'zod';
import { Db } from 'mongodb';
export const RENAME_COLLECTION_TOOL_NAME = 'rename_collection';
export const RENAME_COLLECTION_TOOL_DESCRIPTION =
    'Rename a collection in the MongoDB database.';
export const renameCollectionInputSchema = z.object({
    collection: z.string().describe('Current name of the collection'),
    newName: z.string().describe('New name for the collection'),
    dropTarget: z.boolean().optional().default(false).describe('If true, drop the target collection if it exists')
});
export type RenameCollectionInput = z.infer<typeof renameCollectionInputSchema>;
export interface RenameCollectionOutput {
    success: boolean;
    oldName: string;
    newName: string;
}
export async function executeRenameCollection(db: Db, input: RenameCollectionInput): Promise<RenameCollectionOutput> {
    const existing = await db.listCollections({ name: input.collection }).toArray();
    if (existing.length === 0) {
        throw new Error(`Collection '${input.collection}' does not exist`);
    }

    if (!input.dropTarget) {
        const targetExists = await db.listCollections({ name: input.newName }).toArray();
        if (targetExists.length > 0) {
            throw new Error(`Collection '${input.newName}' already exists. Set dropTarget=true to overwrite.`);
        }
    }
    await db.renameCollection(input.collection, input.newName, { dropTarget: input.dropTarget });
    return {
        success: true,
        oldName: input.collection,
        newName: input.newName
    };
}
export function formatRenameCollectionResponse(output: RenameCollectionOutput): string {
    return `✅ Renamed collection **'${output.oldName}'** → **'${output.newName}'**`;
}
