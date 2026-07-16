import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'storage', 'uploads');

  constructor(private prisma: PrismaService) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, albumId: string): Promise<{ path: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new BadRequestException('Album not found');
    }

    const filename = `${albumId}-${file.originalname}`;
    const filepath = join(this.uploadDir, filename);

    return { path: filepath, filename };
  }

  getUploadPath(): string {
    return this.uploadDir;
  }
}
