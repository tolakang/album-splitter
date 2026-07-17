import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { YouTubeDownloadService } from './youtube.service';

@Module({
  controllers: [DownloadController],
  providers: [DownloadService, YouTubeDownloadService],
  exports: [DownloadService, YouTubeDownloadService],
})
export class DownloadModule {}
