import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';
import * as musicMetadata from 'music-metadata';
import ffmpeg from 'fluent-ffmpeg';

interface Track {
  title: string;
  startTimestamp: number;
}

@Injectable()
export class SplitService {
  private readonly logger = new Logger(SplitService.name);
  private readonly storageDir = join(process.cwd(), 'storage');
  private readonly generatedDir = join(this.storageDir, 'generated');

  constructor(private prisma: PrismaService) {
    if (!existsSync(this.generatedDir)) {
      mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  async splitAudio(
    albumId: string,
    audioPath: string,
    tracks: Track[],
    outputFormat: string = 'mp3',
  ): Promise<string[]> {
    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new Error(`Album ${albumId} not found`);
    }

    const outputDir = join(this.generatedDir, albumId);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    this.logger.log(`Splitting audio for album ${albumId} with ${tracks.length} tracks`);

    const duration = await this.getAudioDuration(audioPath);
    this.logger.log(`Audio duration: ${duration} seconds`);

    const outputFiles: string[] = [];
    const zeroPadding = Math.max(2, String(tracks.length).length);

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const startTimestamp = track.startTimestamp;
      const endTimestamp = i === tracks.length - 1 ? duration : tracks[i + 1].startTimestamp;

      const filename = `${String(i + 1).padStart(zeroPadding, '0')} ${track.title}.${outputFormat}`;
      const outputPath = join(outputDir, filename);

      await this.extractTrack(audioPath, outputPath, startTimestamp, endTimestamp);
      outputFiles.push(outputPath);

      const progress = Math.round(((i + 1) / tracks.length) * 100);
      await this.prisma.album.update({
        where: { id: albumId },
        data: { progress },
      });

      this.logger.log(`Extracted track ${i + 1}/${tracks.length}: ${track.title}`);
    }

    return outputFiles;
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const metadata = await musicMetadata.parseFile(audioPath);
      return metadata.format.duration || 0;
    } catch (error) {
      this.logger.error(`Failed to get audio duration: ${error.message}`);
      throw error;
    }
  }

  private async extractTrack(
    inputPath: string,
    outputPath: string,
    startSeconds: number,
    endSeconds: number,
  ): Promise<void> {
    const duration = endSeconds - startSeconds;
    this.logger.log(`Extracting: ${startSeconds}s to ${endSeconds}s (${duration}s) → ${outputPath}`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startSeconds)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => {
          this.logger.error(`FFmpeg extraction failed: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  async getGeneratedFiles(albumId: string): Promise<string[]> {
    const outputDir = join(this.generatedDir, albumId);
    if (!existsSync(outputDir)) {
      return [];
    }

    return readdirSync(outputDir)
      .filter(file => statSync(join(outputDir, file)).isFile())
      .map(file => join(outputDir, file));
  }

  async deleteGeneratedFiles(albumId: string): Promise<void> {
    const outputDir = join(this.generatedDir, albumId);
    if (existsSync(outputDir)) {
      try {
        rmSync(outputDir, { recursive: true, force: true });
        this.logger.log(`Deleted directory: ${outputDir}`);
      } catch (error) {
        this.logger.error(`Failed to delete directory ${outputDir}: ${error.message}`);
      }
    }
  }
}
