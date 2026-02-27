#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getServer } from './server.js';
import { connectionManager } from './db/connection.js';
import { loadConfig } from './types/config.js';

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  let isShuttingDown = false;

  const shutdown = async (reason: string, exitCode: number): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    try {
      await connectionManager.disconnect();
    } catch (error) {
      console.error(`Failed to disconnect MongoDB during shutdown (${reason}):`, formatError(error));
      process.exit(1);
      return;
    }
    process.exit(exitCode);
  };

  try {
    const config = loadConfig();
    await connectionManager.connect(config);

    const server = getServer();
    const transport = new StdioServerTransport();

    transport.onclose = () => {
      void shutdown('transport_close', 0);
    };

    transport.onerror = (error) => {
      console.error('MCP transport error:', formatError(error));
      void shutdown('transport_error', 1);
    };

    process.once('SIGINT', () => {
      void shutdown('sigint', 0);
    });
    process.once('SIGTERM', () => {
      void shutdown('sigterm', 0);
    });
    process.once('disconnect', () => {
      void shutdown('process_disconnect', 0);
    });
    process.stdin.once('end', () => {
      void shutdown('stdin_end', 0);
    });
    process.stdin.once('close', () => {
      void shutdown('stdin_close', 0);
    });
    process.once('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      void shutdown('unhandled_rejection', 1);
    });
    process.once('uncaughtException', (error) => {
      console.error('Uncaught exception:', formatError(error));
      void shutdown('uncaught_exception', 1);
    });

    await server.connect(transport);
  } catch (error) {
    console.error(
      'Failed to start MongoDB MCP Server:',
      formatError(error)
    );
    await connectionManager.disconnect();
    process.exit(1);
  }
}
main();
