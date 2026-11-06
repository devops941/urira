import os from 'os';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { ENV } from './config/env.js';
import { Food } from './modules/foods/food.model.js';
import { INITIAL_FOODS } from './shared/nutrition/initial-foods.js';

const getLanIp = (): string => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('172.')) {
        return net.address;
      }
    }
  }
  return '192.168.1.4';
};

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB Atlas (cluster0.uurxkmz.mongodb.net/uyira_app)
    await connectDatabase();

    // Ensure verified foods are present in database
    try {
      const foodCount = await Food.countDocuments();
      if (foodCount === 0) {
        console.log('🌱 Seeding initial verified food composition records...');
        await Food.insertMany(INITIAL_FOODS);
        console.log('✅ Initial food compositions seeded successfully!');
      }
    } catch (seedErr) {
      console.warn('Food seed check note:', seedErr);
    }

    // 2. Create Express app
    const app = createApp();

    // 3. Listen on configured PORT on all network interfaces (0.0.0.0)
    const lanIp = getLanIp();
    const server = app.listen(Number(ENV.PORT), '0.0.0.0', () => {
      console.log(`🚀 UYIRA Authentication Backend running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      console.log(`📡 Local: http://localhost:${ENV.PORT}/api/v1/auth`);
      console.log(`📡 LAN:   http://${lanIp}:${ENV.PORT}/api/v1/auth`);
    });

    // Graceful shutdown handling
    const handleShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

