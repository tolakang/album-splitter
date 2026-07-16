import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { AlbumModule } from './album/album.module';
import { UploadModule } from './upload/upload.module';
import { SplitModule } from './split/split.module';
import { DownloadModule } from './download/download.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    QueueModule,
    AlbumModule,
    UploadModule,
    SplitModule,
    DownloadModule,
    CleanupModule,
  ],
})
export class AppModule {}
