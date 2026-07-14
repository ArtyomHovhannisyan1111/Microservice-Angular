module.exports = {
  '/auth': {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
    bypass: function (req) {
      // Browser navigation (text/html) → let Angular router handle it
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return '/index.html';
      }
    }
  },
  '/api': {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true
  }
};
