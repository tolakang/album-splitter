import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Album, AlbumStatus } from '@prisma/client';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title?: string; youtubeUrl?: string }): Promise<Album> {
    return this.prisma.album.create({
      data: {
        title: data.title,
        youtubeUrl: data.youtubeUrl,
        status: AlbumStatus.PENDING,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
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

  async updateProgress(id: string, progress: number): Promise<Album> {
    return this.prisma.album.update({
      where: { id },
      data: { progress },
    });
  }

  async delete(id: string): Promise<void> {
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
