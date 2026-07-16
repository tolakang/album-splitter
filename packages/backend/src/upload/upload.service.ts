import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = join(process.cwd(), 'storage', 'uploads');

  constructor(private prisma: PrismaService) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, albumId: string): Promise<{ filename: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new BadRequestException('Album not found');
    }

    const filename = `${albumId}-${file.originalname}`;
    const filepath = join(this.uploadDir, filename);

    // Write the file buffer to disk
    writeFileSync(filepath, file.buffer);
    this.logger.log(`Saved upload to ${filepath} (${file.size} bytes)`);

    // Persist the audio path on the album record
    await this.prisma.album.update({
      where: { id: albumId },
      data: { audioPath: filepath },
    });

    return { filename };
  }

  getUploadPath(): string {
    return this.uploadDir;
  }
}
