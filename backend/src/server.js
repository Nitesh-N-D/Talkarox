import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initSocketServer } from './sockets/socketServer.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Talkarox backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
