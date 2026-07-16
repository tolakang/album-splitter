import { Controller, Post, Param, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { TrackDto } from '../album/dto/create-album.dto';

@ApiTags('split')
@Controller('api/split')
export class SplitController {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('audio-processing') private audioQueue: Queue,
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

    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new NotFoundException(`Album ${albumId} not found`);
    }

    if (!album.audioPath) {
      throw new BadRequestException('No audio file uploaded for this album');
    }

    await this.prisma.album.update({
      where: { id: albumId },
      data: {
        tracksJson: JSON.stringify(body.tracks),
        status: 'PARSING' as any,
      },
    });

    const job = await this.audioQueue.add('process-album', {
      albumId,
      audioPath: album.audioPath,
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
}
