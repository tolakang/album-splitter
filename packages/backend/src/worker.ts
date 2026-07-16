import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { Queue } from 'bullmq';
import { SplitProcessor } from './split/split.processor';

const logger = new Logger('Worker');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get the processor from the NestJS container and register the BullMQ worker
  const processor = app.get(SplitProcessor);
  const queue = app.get<Queue>('BullQueue_audio-processing');

  // The SplitProcessor extends WorkerHost which creates a BullMQ Worker internally.
  // We just need to keep the process alive by registering signal handlers.
  logger.log('Worker started, listening for jobs...');

  const shutdown = async (signal: string) => {
    logger.log(`${signal} received, shutting down worker...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
