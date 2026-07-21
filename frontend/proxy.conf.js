module.exports = {
  '/auth': {
    target: 'http://localhost:8090',
    secure: false,
    changeOrigin: true,
    bypass: function (req) {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return '/index.html';
      }
    }
  },
  '/api': {
    target: 'http://localhost:8090',
    secure: false,
    changeOrigin: true
  },
  '/ws': {
    target: 'http://localhost:8098',
    secure: false,
    changeOrigin: true,
    ws: true
  }
};
