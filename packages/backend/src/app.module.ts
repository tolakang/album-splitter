import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma.module';
import { AppController } from './app.controller';
import { AlbumModule } from './album/album.module';
import { UploadModule } from './upload/upload.module';
import { SplitModule } from './split/split.module';
import { DownloadModule } from './download/download.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    QueueModule,
    AlbumModule,
    UploadModule,
    SplitModule,
    DownloadModule,
    CleanupModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
