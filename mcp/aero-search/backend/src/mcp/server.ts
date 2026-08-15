import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './createMcpServer';

dotenv.config();

const MCP_PORT = Number(process.env.MCP_PORT ?? 3003);
const MCP_HOST = process.env.MCP_HOST ?? '127.0.0.1';

const app = createMcpExpressApp({ host: MCP_HOST });
const transports: Record<string, StreamableHTTPServerTransport> = {};

function getTransport(sessionId: string | undefined): StreamableHTTPServerTransport | undefined {
  if (!sessionId) {
    return undefined;
  }
  return transports[sessionId];
}

async function handleMcpPost(req: Request, res: Response): Promise<void> {
  try {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

    let transport = getTransport(sessionId);

    if (!transport && !sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          if (transport) {
            transports[id] = transport;
          }
        },
      });

      transport.onclose = () => {
        const sid = transport?.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!transport) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP POST error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
}

async function handleMcpGet(req: Request, res: Response): Promise<void> {
  const sessionIdHeader = req.headers['mcp-session-id'];
  const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
  const transport = getTransport(sessionId);

  if (!transport) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  await transport.handleRequest(req, res);
}

async function handleMcpDelete(req: Request, res: Response): Promise<void> {
  const sessionIdHeader = req.headers['mcp-session-id'];
  const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;
  const transport = getTransport(sessionId);

  if (!transport) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  await transport.handleRequest(req, res);
}

app.post('/mcp', handleMcpPost);
app.get('/mcp', handleMcpGet);
app.delete('/mcp', handleMcpDelete);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', transport: 'streamable-http', endpoint: '/mcp' });
});

const server = app.listen(MCP_PORT, MCP_HOST, () => {
  console.log(`MCP Streamable HTTP listening on http://${MCP_HOST}:${MCP_PORT}/mcp`);
});

async function shutdown(): Promise<void> {
  for (const sessionId of Object.keys(transports)) {
    try {
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing MCP session ${sessionId}:`, error);
    }
  }

  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
