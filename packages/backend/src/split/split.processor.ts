import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SplitService } from './split.service';
import { AlbumStatus } from '@prisma/client';

interface AudioJobData {
  albumId: string;
  audioPath: string;
  tracks: Array<{ title: string; startTimestamp: number }>;
  outputFormat?: string;
}

@Processor('audio-processing')
export class SplitProcessor {
  private readonly logger = new Logger(SplitProcessor.name);

  constructor(
    private prisma: PrismaService,
    private splitService: SplitService,
  ) {}

  @Process('process-album')
  async handleProcessAlbum(job: Job<AudioJobData>) {
    const { albumId, audioPath, tracks, outputFormat } = job.data;
    
    this.logger.log(`Processing album ${albumId} with ${tracks.length} tracks`);

    try {
      // Update album status to splitting
      await this.prisma.album.update({
        where: { id: albumId },
        data: { status: AlbumStatus.SPLITTING },
      });

      // Split the audio
      const outputFiles = await this.splitService.splitAudio(
        albumId,
        audioPath,
        tracks,
        outputFormat,
      );

      // Create generated file records
      for (const filePath of outputFiles) {
        const filename = filePath.split('/').pop() || '';
        const stats = require('fs').statSync(filePath);
        
        await this.prisma.generatedFile.create({
          data: {
            albumId,
            filename,
            size: BigInt(stats.size),
            path: filePath,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        });
      }

      // Update album status to completed
      await this.prisma.album.update({
        where: { id: albumId },
        data: { 
          status: AlbumStatus.COMPLETED,
          progress: 100,
        },
      });

      this.logger.log(`Completed processing album ${albumId}`);
      return { success: true, fileCount: outputFiles.length };

    } catch (error) {
      this.logger.error(`Failed to process album ${albumId}: ${error.message}`);
      
      await this.prisma.album.update({
        where: { id: albumId },
        data: { 
          status: AlbumStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
