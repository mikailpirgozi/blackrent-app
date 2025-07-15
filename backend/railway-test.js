const express = require('express');
const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

console.log('🚀 Railway Test Server Starting...');
console.log('📊 Port:', PORT);
console.log('📊 Environment:', process.env.NODE_ENV);

// Simple health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({
    success: true,
    message: 'Railway Test Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('✅ Root endpoint called');
  res.json({
    success: true,
    message: 'Railway Test Server Root',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 Railway Test Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Root: http://localhost:${PORT}/`);
});

server.on('error', (error) => {
  console.error('💥 Server error:', error);
});

server.on('listening', () => {
  console.log(`🎉 Server successfully listening on port ${PORT}`);
}); 