import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('audio-processing') private audioQueue: Queue,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
  ) {}

  async addAudioJob(albumId: string, data: any): Promise<string> {
    const job = await this.audioQueue.add('process-album', {
      albumId,
      ...data,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    
    this.logger.log(`Added audio job ${job.id} for album ${albumId}`);
    return job.id!;
  }

  async addCleanupJob(data: any): Promise<string> {
    const job = await this.cleanupQueue.add('cleanup-expired', data, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    this.logger.log(`Added cleanup job ${job.id}`);
    return job.id!;
  }

  async getJobStatus(queueName: string, jobId: string): Promise<any> {
    const queue = queueName === 'audio-processing' ? this.audioQueue : this.cleanupQueue;
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress,
      status: await job.getState(),
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    };
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = queueName === 'audio-processing' ? this.audioQueue : this.cleanupQueue;
    const job = await queue.getJob(jobId);
    
    if (job) {
      await job.remove();
      this.logger.log(`Removed job ${jobId} from ${queueName}`);
    }
  }
}
