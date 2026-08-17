#!/usr/bin/env node
// Streamable-HTTP wrapper around the mcp-omnisearch stdio upstream.
//
// Layout: we spawn `mcp-proxy` on an internal port; this script binds the
// public port and forwards every non-`/health` request to it.

import { spawn } from 'node:child_process';
import { request as http_request } from 'node:http';
import { createServer } from 'node:http';
import process from 'node:process';

const UPSTREAM_HOST = '127.0.0.1';
const UPSTREAM_PORT = Number.parseInt(process.env.UPSTREAM_PORT || '8080', 10);
const PUBLIC_PORT = Number.parseInt(process.env.PORT || '3000', 10);

function startUpstream() {
	const child = spawn(
		'mcp-proxy',
		[
			'--upstreamProtocol',
			'auto',
			'--port',
			String(UPSTREAM_PORT),
			'--host',
			UPSTREAM_HOST,
			'--stateless',
			'--',
			'mcp-omnisearch',
		],
		{ stdio: 'inherit', env: process.env },
	);

	child.on('exit', (code, signal) => {
		console.error(`mcp-proxy exited code=${code} signal=${signal}`);
		process.exit(code ?? 1);
	});

	process.on('SIGINT', () => child.kill('SIGINT'));
	process.on('SIGTERM', () => child.kill('SIGTERM'));
}

function forward(req, res) {
	const headers = { ...req.headers };
	delete headers.host;

	const upstreamReq = http_request(
		{
			hostname: UPSTREAM_HOST,
			port: UPSTREAM_PORT,
			method: req.method,
			path: req.url,
			headers,
		},
		(upstreamRes) => {
			res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
			upstreamRes.pipe(res);
		},
	);

	upstreamReq.on('error', (err) => {
		console.error('upstream error', err);
		if (!res.headersSent) {
			res.writeHead(502, { 'content-type': 'application/json' });
		}
		res.end(JSON.stringify({ error: 'upstream_unavailable', detail: String(err) }));
	});

	req.on('error', (err) => upstreamReq.destroy(err));
	req.pipe(upstreamReq);
}

startUpstream();

const server = createServer((req, res) => {
	if (req.url === '/health') {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ status: 'ok', service: 'mcp-omnisearch' }));
		return;
	}
	forward(req, res);
});

server.listen(PUBLIC_PORT, () => {
	console.log(`mcp-omnisearch HTTP wrapper listening on :${PUBLIC_PORT}`);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
