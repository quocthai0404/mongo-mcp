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

export const SERVER_NAME = 'mongo-mcp';
export const SERVER_VERSION = '1.0.0';

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

  return server;
}

let serverInstance: McpServer | null = null;

export function getServer(): McpServer {
  if (!serverInstance) {
    serverInstance = createServer();
  }
  return serverInstance;
}
