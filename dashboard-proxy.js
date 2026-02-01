#!/usr/bin/env node
/**
 * ClawBot Dashboard Proxy - Expose dashboard externally
 */

const http = require('http');
const httpProxy = require('http-proxy-middleware');

const proxy = http.createServer();

// Proxy to ClawBot dashboard
const clawbotProxy = httpProxy.createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
});

proxy.on('request', clawbotProxy);

const PORT = process.env.DASHBOARD_PORT || 3004;

proxy.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 ClawBot Dashboard Proxy running on port ${PORT}`);
  console.log(`📊 Dashboard: http://89.167.28.237:${PORT}`);
  console.log(`🔗 Direct access: http://localhost:3003`);
});

proxy.on('error', (err) => {
  console.error('Proxy error:', err.message);
});