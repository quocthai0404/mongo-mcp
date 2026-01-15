import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { connectionManager } from './db/connection.js';
import {
  SCHEMA_OVERVIEW_URI,
  generateSchemaOverview,
  formatSchemaOverviewText,
} from './resources/schema-overview.js';
import {
  LIST_COLLECTIONS_TOOL_NAME,
  LIST_COLLECTIONS_TOOL_DESCRIPTION,
  listCollectionsInputSchema,
  executeListCollections,
  formatListCollectionsResponse,
} from './tools/list-collections.js';
import {
  INFER_SCHEMA_TOOL_NAME,
  INFER_SCHEMA_TOOL_DESCRIPTION,
  inferSchemaInputSchema,
  executeInferSchema,
  formatInferSchemaResponse,
} from './tools/infer-schema.js';
import {
  SAMPLE_DATA_TOOL_NAME,
  SAMPLE_DATA_TOOL_DESCRIPTION,
  sampleDataInputSchema,
  executeSampleData,
  formatSampleDataResponse,
} from './tools/sample-data.js';
import {
  VALIDATE_QUERY_TOOL_NAME,
  VALIDATE_QUERY_TOOL_DESCRIPTION,
  validateQueryInputSchema,
  executeValidateQuery,
  formatValidateQueryResponse,
} from './tools/validate-query.js';

import {
  LIST_DATABASES_TOOL_NAME,
  LIST_DATABASES_TOOL_DESCRIPTION,
  listDatabasesInputSchema,
  executeListDatabases,
  formatListDatabasesResponse,
} from './tools/list-databases.js';
import {
  USE_DATABASE_TOOL_NAME,
  USE_DATABASE_TOOL_DESCRIPTION,
  useDatabaseInputSchema,
  executeUseDatabase,
  formatUseDatabaseResponse,
} from './tools/use-database.js';
import {
  CURRENT_DATABASE_TOOL_NAME,
  CURRENT_DATABASE_TOOL_DESCRIPTION,
  currentDatabaseInputSchema,
  executeCurrentDatabase,
  formatCurrentDatabaseResponse,
} from './tools/current-database.js';
import {
  FIND_TOOL_NAME,
  FIND_TOOL_DESCRIPTION,
  findInputSchema,
  executeFind,
  formatFindResponse,
} from './tools/find.js';
import {
  COUNT_TOOL_NAME,
  COUNT_TOOL_DESCRIPTION,
  countInputSchema,
  executeCount,
  formatCountResponse,
} from './tools/count.js';
import {
  DISTINCT_TOOL_NAME,
  DISTINCT_TOOL_DESCRIPTION,
  distinctInputSchema,
  executeDistinct,
  formatDistinctResponse,
} from './tools/distinct.js';

import {
  AGGREGATE_TOOL_NAME,
  AGGREGATE_TOOL_DESCRIPTION,
  aggregateInputSchema,
  executeAggregate,
  formatAggregateResponse,
} from './tools/aggregate.js';
import {
  EXPLAIN_TOOL_NAME,
  EXPLAIN_TOOL_DESCRIPTION,
  explainInputSchema,
  executeExplain,
  formatExplainResponse,
} from './tools/explain.js';
import {
  DB_STATS_TOOL_NAME,
  DB_STATS_TOOL_DESCRIPTION,
  dbStatsInputSchema,
  executeDbStats,
  formatDbStatsResponse,
} from './tools/db-stats.js';

import {
  INSERT_ONE_TOOL_NAME,
  INSERT_ONE_TOOL_DESCRIPTION,
  insertOneInputSchema,
  executeInsertOne,
  formatInsertOneResponse,
} from './tools/insert-one.js';
import {
  INSERT_MANY_TOOL_NAME,
  INSERT_MANY_TOOL_DESCRIPTION,
  insertManyInputSchema,
  executeInsertMany,
  formatInsertManyResponse,
} from './tools/insert-many.js';
import {
  UPDATE_ONE_TOOL_NAME,
  UPDATE_ONE_TOOL_DESCRIPTION,
  updateOneInputSchema,
  executeUpdateOne,
  formatUpdateOneResponse,
} from './tools/update-one.js';
import {
  UPDATE_MANY_TOOL_NAME,
  UPDATE_MANY_TOOL_DESCRIPTION,
  updateManyInputSchema,
  executeUpdateMany,
  formatUpdateManyResponse,
} from './tools/update-many.js';
import {
  DELETE_ONE_TOOL_NAME,
  DELETE_ONE_TOOL_DESCRIPTION,
  deleteOneInputSchema,
  executeDeleteOne,
  formatDeleteOneResponse,
} from './tools/delete-one.js';
import {
  DELETE_MANY_TOOL_NAME,
  DELETE_MANY_TOOL_DESCRIPTION,
  deleteManyInputSchema,
  executeDeleteMany,
  formatDeleteManyResponse,
} from './tools/delete-many.js';

import {
  LIST_INDEXES_TOOL_NAME,
  LIST_INDEXES_TOOL_DESCRIPTION,
  listIndexesInputSchema,
  executeListIndexes,
  formatListIndexesResponse,
} from './tools/list-indexes.js';
import {
  CREATE_INDEX_TOOL_NAME,
  CREATE_INDEX_TOOL_DESCRIPTION,
  createIndexInputSchema,
  executeCreateIndex,
  formatCreateIndexResponse,
} from './tools/create-index.js';
import {
  DROP_INDEX_TOOL_NAME,
  DROP_INDEX_TOOL_DESCRIPTION,
  dropIndexInputSchema,
  executeDropIndex,
  formatDropIndexResponse,
} from './tools/drop-index.js';

import {
  CREATE_COLLECTION_TOOL_NAME,
  CREATE_COLLECTION_TOOL_DESCRIPTION,
  createCollectionInputSchema,
  executeCreateCollection,
  formatCreateCollectionResponse,
} from './tools/create-collection.js';
import {
  DROP_COLLECTION_TOOL_NAME,
  DROP_COLLECTION_TOOL_DESCRIPTION,
  dropCollectionInputSchema,
  executeDropCollection,
  formatDropCollectionResponse,
} from './tools/drop-collection.js';
import {
  RENAME_COLLECTION_TOOL_NAME,
  RENAME_COLLECTION_TOOL_DESCRIPTION,
  renameCollectionInputSchema,
  executeRenameCollection,
  formatRenameCollectionResponse,
} from './tools/rename-collection.js';
import {
  DROP_DATABASE_TOOL_NAME,
  DROP_DATABASE_TOOL_DESCRIPTION,
  dropDatabaseInputSchema,
  executeDropDatabase,
  formatDropDatabaseResponse,
} from './tools/drop-database.js';
import {
  COLLECTION_STORAGE_SIZE_TOOL_NAME,
  COLLECTION_STORAGE_SIZE_TOOL_DESCRIPTION,
  collectionStorageSizeInputSchema,
  executeCollectionStorageSize,
  formatCollectionStorageSizeResponse,
} from './tools/collection-storage-size.js';

import { checkToolSecurity } from './services/security.js';
export const SERVER_NAME = 'mongo-mcp';
export const SERVER_VERSION = '1.0.0';
function createSecureHandler(
  toolName: string,
  handler: () => Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }>
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
  const check = checkToolSecurity(toolName);
  if (!check.allowed) {
    return Promise.resolve({
      content: [{ type: 'text' as const, text: `🔒 **Security Block**: ${check.reason}` }],
      isError: true,
    });
  }
  return handler();
}
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  server.resource(
    SCHEMA_OVERVIEW_URI,
    SCHEMA_OVERVIEW_URI,
    async () => {
      try {
        const db = connectionManager.getDb();
        const overview = await generateSchemaOverview(db);
        return {
          contents: [
            {
              uri: SCHEMA_OVERVIEW_URI,
              mimeType: 'text/plain',
              text: formatSchemaOverviewText(overview),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          contents: [
            {
              uri: SCHEMA_OVERVIEW_URI,
              mimeType: 'text/plain',
              text: `Error retrieving schema overview: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
  server.tool(
    LIST_COLLECTIONS_TOOL_NAME,
    LIST_COLLECTIONS_TOOL_DESCRIPTION,
    listCollectionsInputSchema.shape,
    async () => {
      try {
        const db = connectionManager.getDb();
        const output = await executeListCollections(db);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatListCollectionsResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to list collections: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
  server.tool(
    INFER_SCHEMA_TOOL_NAME,
    INFER_SCHEMA_TOOL_DESCRIPTION,
    inferSchemaInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = inferSchemaInputSchema.parse(args);
        const schema = await executeInferSchema(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatInferSchemaResponse(schema),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );
  server.tool(
    SAMPLE_DATA_TOOL_NAME,
    SAMPLE_DATA_TOOL_DESCRIPTION,
    sampleDataInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = sampleDataInputSchema.parse(args);
        const result = await executeSampleData(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatSampleDataResponse(result),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );
  server.tool(
    VALIDATE_QUERY_TOOL_NAME,
    VALIDATE_QUERY_TOOL_DESCRIPTION,
    validateQueryInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = validateQueryInputSchema.parse(args);
        const result = await executeValidateQuery(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatValidateQueryResponse(result),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    LIST_DATABASES_TOOL_NAME,
    LIST_DATABASES_TOOL_DESCRIPTION,
    listDatabasesInputSchema.shape,
    async () => {
      try {
        const client = connectionManager.getClient();
        const output = await executeListDatabases(client);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatListDatabasesResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to list databases: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    USE_DATABASE_TOOL_NAME,
    USE_DATABASE_TOOL_DESCRIPTION,
    useDatabaseInputSchema.shape,
    async (args) => {
      try {
        const input = useDatabaseInputSchema.parse(args);
        const output = await executeUseDatabase(connectionManager, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatUseDatabaseResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to switch database: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    CURRENT_DATABASE_TOOL_NAME,
    CURRENT_DATABASE_TOOL_DESCRIPTION,
    currentDatabaseInputSchema.shape,
    async () => {
      try {
        const output = await executeCurrentDatabase(connectionManager);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatCurrentDatabaseResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to get current database: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    FIND_TOOL_NAME,
    FIND_TOOL_DESCRIPTION,
    findInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = findInputSchema.parse(args);
        const output = await executeFind(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatFindResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to find documents: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    COUNT_TOOL_NAME,
    COUNT_TOOL_DESCRIPTION,
    countInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = countInputSchema.parse(args);
        const output = await executeCount(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatCountResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to count documents: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DISTINCT_TOOL_NAME,
    DISTINCT_TOOL_DESCRIPTION,
    distinctInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = distinctInputSchema.parse(args);
        const output = await executeDistinct(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatDistinctResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to get distinct values: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    AGGREGATE_TOOL_NAME,
    AGGREGATE_TOOL_DESCRIPTION,
    aggregateInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = aggregateInputSchema.parse(args);
        const output = await executeAggregate(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatAggregateResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to execute aggregation: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    EXPLAIN_TOOL_NAME,
    EXPLAIN_TOOL_DESCRIPTION,
    explainInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = explainInputSchema.parse(args);
        const output = await executeExplain(db, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatExplainResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to explain query: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DB_STATS_TOOL_NAME,
    DB_STATS_TOOL_DESCRIPTION,
    dbStatsInputSchema.shape,
    async () => {
      try {
        const db = connectionManager.getDb();
        const output = await executeDbStats(db);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatDbStatsResponse(output),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to get database stats: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    INSERT_ONE_TOOL_NAME,
    INSERT_ONE_TOOL_DESCRIPTION,
    insertOneInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = insertOneInputSchema.parse(args);
        const output = await executeInsertOne(db, input);
        return {
          content: [{ type: 'text' as const, text: formatInsertOneResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to insert: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    INSERT_MANY_TOOL_NAME,
    INSERT_MANY_TOOL_DESCRIPTION,
    insertManyInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = insertManyInputSchema.parse(args);
        const output = await executeInsertMany(db, input);
        return {
          content: [{ type: 'text' as const, text: formatInsertManyResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to insert: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    UPDATE_ONE_TOOL_NAME,
    UPDATE_ONE_TOOL_DESCRIPTION,
    updateOneInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = updateOneInputSchema.parse(args);
        const output = await executeUpdateOne(db, input);
        return {
          content: [{ type: 'text' as const, text: formatUpdateOneResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to update: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    UPDATE_MANY_TOOL_NAME,
    UPDATE_MANY_TOOL_DESCRIPTION,
    updateManyInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = updateManyInputSchema.parse(args);
        const output = await executeUpdateMany(db, input);
        return {
          content: [{ type: 'text' as const, text: formatUpdateManyResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to update: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DELETE_ONE_TOOL_NAME,
    DELETE_ONE_TOOL_DESCRIPTION,
    deleteOneInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = deleteOneInputSchema.parse(args);
        const output = await executeDeleteOne(db, input);
        return {
          content: [{ type: 'text' as const, text: formatDeleteOneResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to delete: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DELETE_MANY_TOOL_NAME,
    DELETE_MANY_TOOL_DESCRIPTION,
    deleteManyInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = deleteManyInputSchema.parse(args);
        const output = await executeDeleteMany(db, input);
        return {
          content: [{ type: 'text' as const, text: formatDeleteManyResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to delete: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    LIST_INDEXES_TOOL_NAME,
    LIST_INDEXES_TOOL_DESCRIPTION,
    listIndexesInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = listIndexesInputSchema.parse(args);
        const output = await executeListIndexes(db, input);
        return {
          content: [{ type: 'text' as const, text: formatListIndexesResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to list indexes: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    CREATE_INDEX_TOOL_NAME,
    CREATE_INDEX_TOOL_DESCRIPTION,
    createIndexInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = createIndexInputSchema.parse(args);
        const output = await executeCreateIndex(db, input);
        return {
          content: [{ type: 'text' as const, text: formatCreateIndexResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to create index: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DROP_INDEX_TOOL_NAME,
    DROP_INDEX_TOOL_DESCRIPTION,
    dropIndexInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = dropIndexInputSchema.parse(args);
        const output = await executeDropIndex(db, input);
        return {
          content: [{ type: 'text' as const, text: formatDropIndexResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to drop index: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    CREATE_COLLECTION_TOOL_NAME,
    CREATE_COLLECTION_TOOL_DESCRIPTION,
    createCollectionInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = createCollectionInputSchema.parse(args);
        const output = await executeCreateCollection(db, input);
        return {
          content: [{ type: 'text' as const, text: formatCreateCollectionResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to create collection: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DROP_COLLECTION_TOOL_NAME,
    DROP_COLLECTION_TOOL_DESCRIPTION,
    dropCollectionInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = dropCollectionInputSchema.parse(args);
        const output = await executeDropCollection(db, input);
        return {
          content: [{ type: 'text' as const, text: formatDropCollectionResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to drop collection: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    RENAME_COLLECTION_TOOL_NAME,
    RENAME_COLLECTION_TOOL_DESCRIPTION,
    renameCollectionInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = renameCollectionInputSchema.parse(args);
        const output = await executeRenameCollection(db, input);
        return {
          content: [{ type: 'text' as const, text: formatRenameCollectionResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to rename collection: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    DROP_DATABASE_TOOL_NAME,
    DROP_DATABASE_TOOL_DESCRIPTION,
    dropDatabaseInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = dropDatabaseInputSchema.parse(args);
        const output = await executeDropDatabase(db, input);
        return {
          content: [{ type: 'text' as const, text: formatDropDatabaseResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to drop database: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    COLLECTION_STORAGE_SIZE_TOOL_NAME,
    COLLECTION_STORAGE_SIZE_TOOL_DESCRIPTION,
    collectionStorageSizeInputSchema.shape,
    async (args) => {
      try {
        const db = connectionManager.getDb();
        const input = collectionStorageSizeInputSchema.parse(args);
        const output = await executeCollectionStorageSize(db, input);
        return {
          content: [{ type: 'text' as const, text: formatCollectionStorageSizeResponse(output) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to get collection size: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );
  return server;
}
let serverInstance: McpServer | null = null;
export function getServer(): McpServer {
  if (!serverInstance) {
    serverInstance = createServer();
  }
  return serverInstance;
}
