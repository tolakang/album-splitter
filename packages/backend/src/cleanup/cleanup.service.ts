import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SplitService } from '../split/split.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlbumStatus } from '@prisma/client';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private prisma: PrismaService,
    private splitService: SplitService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredFiles() {
    this.logger.log('Running cleanup for expired files...');

    try {
      // Find expired albums
      const expiredAlbums = await this.prisma.album.findMany({
        where: {
          expiresAt: { lt: new Date() },
        },
        include: { generatedFiles: true },
      });

      this.logger.log(`Found ${expiredAlbums.length} expired albums`);

      for (const album of expiredAlbums) {
        await this.cleanupAlbum(album.id);
      }

      // Clean up orphaned files
      await this.cleanupOrphanedFiles();

      this.logger.log('Cleanup completed');

    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }

  async cleanupAlbum(albumId: string): Promise<void> {
    this.logger.log(`Cleaning up album ${albumId}`);

    try {
      // Delete generated files from disk
      await this.splitService.deleteGeneratedFiles(albumId);

      // Delete file records from database
      await this.prisma.generatedFile.deleteMany({
        where: { albumId },
      });

      // Delete album
      await this.prisma.album.delete({
        where: { id: albumId },
      });

      this.logger.log(`Cleaned up album ${albumId}`);

    } catch (error) {
      this.logger.error(`Failed to cleanup album ${albumId}: ${error.message}`);
    }
  }

  async cleanupOrphanedFiles(): Promise<void> {
    // Find completed albums where all generated files are downloaded
    const completedAlbums = await this.prisma.album.findMany({
      where: {
        status: AlbumStatus.COMPLETED,
      },
      include: { generatedFiles: true },
    });

    for (const album of completedAlbums) {
      if (album.generatedFiles.length > 0 && album.generatedFiles.every(f => f.downloaded)) {
        this.logger.log(`Album ${album.id} has all files downloaded, cleaning up`);
        await this.cleanupAlbum(album.id);
      }
    }
  }

  async manualCleanup(): Promise<{ cleaned: number }> {
    this.logger.log('Manual cleanup triggered');
    
    const expiredAlbums = await this.prisma.album.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    for (const album of expiredAlbums) {
      await this.cleanupAlbum(album.id);
    }

    return { cleaned: expiredAlbums.length };
  }
}
