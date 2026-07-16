import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('Worker started, listening for jobs...');
  
  // Keep the process alive
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down worker...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
