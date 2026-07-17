import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Album, AlbumStatus } from '@prisma/client';
import { SplitService } from '../split/split.service';

@Injectable()
export class AlbumService {
  private readonly logger = new Logger(AlbumService.name);

  constructor(
    private prisma: PrismaService,
    private splitService: SplitService,
  ) {}

  async create(data: {
    title?: string;
    youtubeUrl?: string;
    artist?: string;
    albumName?: string;
    year?: number;
  }): Promise<Album> {
    return this.prisma.album.create({
      data: {
        title: data.title,
        youtubeUrl: data.youtubeUrl,
        artist: data.artist,
        albumName: data.albumName,
        year: data.year,
        status: AlbumStatus.PENDING,
      },
    });
  }

  async findById(id: string): Promise<Album> {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: { tasks: true, generatedFiles: true },
    });
    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }
    return album;
  }

  async findAll(): Promise<Album[]> {
    return this.prisma.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tasks: true, generatedFiles: true },
    });
  }

  async updateStatus(id: string, status: AlbumStatus, errorMessage?: string): Promise<Album> {
    return this.prisma.album.update({
      where: { id },
      data: { status, errorMessage },
    });
  }

  async updateAudioPath(id: string, audioPath: string): Promise<Album> {
    return this.prisma.album.update({
      where: { id },
      data: { audioPath },
    });
  }

  async updateProgress(id: string, progress: number): Promise<Album> {    return this.prisma.album.update({
      where: { id },
      data: { progress },
    });
  }

  async delete(id: string): Promise<void> {
    // Clean up disk files before deleting DB record
    try {
      await this.splitService.deleteGeneratedFiles(id);
    } catch (error) {
      this.logger.warn(`Failed to clean disk files for album ${id}: ${error.message}`);
    }
    await this.prisma.album.delete({ where: { id } });
  }

  async findExpired(): Promise<Album[]> {
    return this.prisma.album.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
