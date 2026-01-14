#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getServer } from './server.js';
import { connectionManager } from './db/connection.js';
import { loadConfig } from './types/config.js';

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    await connectionManager.connect(config);
    const server = getServer();
    const transport = new StdioServerTransport();

    const shutdown = async (): Promise<void> => {
      await connectionManager.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    await server.connect(transport);
  } catch (error) {
    console.error(
      'Failed to start MongoDB MCP Server:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
