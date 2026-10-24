#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

// stdout carries the MCP protocol; log to stderr only.
const server = createServer();
await server.connect(new StdioServerTransport());
console.error('placement-mcp-server running on stdio');
