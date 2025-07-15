const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

console.log('🌐 Port configuration:', {
  PORT: PORT,
  'process.env.PORT': process.env.PORT,
  'typeof PORT': typeof PORT
}); 