import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { statSync } from 'fs';
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
export class SplitProcessor extends WorkerHost {
  private readonly logger = new Logger(SplitProcessor.name);

  constructor(
    private prisma: PrismaService,
    private splitService: SplitService,
  ) {
    super();
  }

  async process(job: Job<AudioJobData>): Promise<any> {
    const { albumId, audioPath, tracks, outputFormat } = job.data;

    this.logger.log(`Processing album ${albumId} with ${tracks.length} tracks`);

    try {
      await this.prisma.album.update({
        where: { id: albumId },
        data: { status: AlbumStatus.SPLITTING },
      });

      const outputFiles = await this.splitService.splitAudio(
        albumId,
        audioPath,
        tracks,
        outputFormat,
      );

      for (const filePath of outputFiles) {
        const filename = filePath.split('/').pop() || '';
        const stats = statSync(filePath);

        await this.prisma.generatedFile.create({
          data: {
            albumId,
            filename,
            size: stats.size,
            path: filePath,
          },
        });
      }

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

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
