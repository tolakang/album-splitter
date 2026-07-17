import { Injectable, Logger } from '@nestjs/common';
import ytdl from '@distube/ytdl-core';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';

@Injectable()
export class YouTubeDownloadService {
  private readonly logger = new Logger(YouTubeService.name);

  async download(url: string, outputDir: string): Promise<string> {
    if (!ytdl.validateURL(url)) {
      throw new Error(`Invalid YouTube URL: ${url}`);
    }

    await mkdir(outputDir, { recursive: true });

    const info = await ytdl.getBasicInfo(url);
    const safeTitle = (info.videoDetails.title || 'youtube-audio')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = `${uuidv4()}_${safeTitle}.mp4`;
    const outputPath = join(outputDir, filename);

    this.logger.log(`Downloading YouTube audio: ${url} -> ${outputPath}`);

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    await pipeline(stream, createWriteStream(outputPath));

    this.logger.log(`YouTube download complete: ${outputPath}`);
    return outputPath;
  }
}
