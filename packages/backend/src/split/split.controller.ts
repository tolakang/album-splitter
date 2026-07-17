import { Controller, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AlbumService } from '../album/album.service';
import { TrackDto } from '../album/dto/create-album.dto';
import { AlbumStatus } from '@prisma/client';
import { YouTubeDownloadService } from '../download/youtube.service';
import { join } from 'path';

@ApiTags('split')
@Controller('split')
export class SplitController {
  constructor(
    private albumService: AlbumService,
    @InjectQueue('audio-processing') private audioQueue: Queue,
    private youtubeService: YouTubeDownloadService,
  ) {}

  @Post(':albumId')
  @ApiOperation({ summary: 'Trigger audio splitting for an album' })
  @ApiResponse({ status: 201, description: 'Split job queued' })
  async triggerSplit(
    @Param('albumId') albumId: string,
    @Body() body: { tracks: TrackDto[]; outputFormat?: string },
  ) {
    if (!body.tracks || body.tracks.length === 0) {
      throw new BadRequestException('At least one track is required');
    }

    const album = await this.albumService.findById(albumId);

    let audioPath = album.audioPath;

    if (!audioPath && album.youtubeUrl) {
      await this.albumService.updateStatus(albumId, AlbumStatus.DOWNLOADING);
      audioPath = await this.youtubeService.download(
        album.youtubeUrl,
        this.youtubeDownloadDir(albumId),
      );
      await this.albumService.updateAudioPath(albumId, audioPath);
    }

    if (!audioPath) {
      throw new BadRequestException('No audio file uploaded for this album');
    }

    await this.albumService.updateStatus(albumId, AlbumStatus.PARSING);

    const job = await this.audioQueue.add('process-album', {
      albumId,
      audioPath,
      tracks: body.tracks,
      outputFormat: body.outputFormat || 'mp3',
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    return { jobId: job.id, albumId, message: 'Split job queued' };
  }

  private youtubeDownloadDir(albumId: string): string {
    return join(process.cwd(), 'storage', 'downloads', albumId);
  }
}
