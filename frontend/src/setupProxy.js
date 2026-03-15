const { createProxyMiddleware } = require('http-proxy-middleware');

const resolveProxyTarget = () => {
  const configuredApiUrl = process.env.REACT_APP_API_URL;

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