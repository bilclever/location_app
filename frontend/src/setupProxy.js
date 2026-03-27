const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const readEnvApiUrl = () => {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^REACT_APP_API_URL\s*=\s*(.+)$/m);
    return match ? match[1].trim() : '';
  } catch (_error) {
    return '';
  }
};

const resolveProxyTarget = () => {
  const configuredApiUrl = process.env.REACT_APP_API_URL || readEnvApiUrl();

  if (configuredApiUrl) {
    try {
      const parsedUrl = new URL(configuredApiUrl);
      return parsedUrl.origin;
    } catch (_error) {
      // Ignore invalid URLs and use the local backend fallback.
    }
  }

  return 'http://localhost:8000';
};

const target = resolveProxyTarget();

module.exports = function setupProxy(app) {
  app.use(
    ['/api', '/media'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
    })
  );
};