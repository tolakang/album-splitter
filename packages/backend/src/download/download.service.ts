import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { existsSync, createReadStream, statSync } from 'fs';
import { join } from 'path';
import * as archiver from 'archiver';
import { Response } from 'express';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly generatedDir = join(process.cwd(), 'storage', 'generated');

  constructor(private prisma: PrismaService) {}

  async downloadFile(fileId: string, res: Response): Promise<void> {
    const file = await this.prisma.generatedFile.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (!existsSync(file.path)) {
      throw new NotFoundException(`File not found on disk`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    const stream = createReadStream(file.path);
    stream.pipe(res);

    // Mark as downloaded
    await this.prisma.generatedFile.update({
      where: { id: fileId },
      data: { downloaded: true },
    });
  }

  async downloadAlbumZip(albumId: string, res: Response): Promise<void> {
    const album = await this.prisma.album.findUnique({ 
      where: { id: albumId },
      include: { generatedFiles: true },
    });
    
    if (!album) {
      throw new NotFoundException(`Album ${albumId} not found`);
    }

    if (album.generatedFiles.length === 0) {
      throw new NotFoundException(`No files found for album ${albumId}`);
    }

    const albumTitle = album.title || albumId;
    const zipFilename = `${albumTitle}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 1 } }); // Low compression for speed
    archive.pipe(res);

    for (const file of album.generatedFiles) {
      if (existsSync(file.path)) {
        archive.file(file.path, { name: file.filename });
      }
    }

    await archive.finalize();

    // Mark all files as downloaded
    await this.prisma.generatedFile.updateMany({
      where: { albumId },
      data: { downloaded: true },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.prisma.generatedFile.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (existsSync(file.path)) {
      const { unlinkSync } = require('fs');
      unlinkSync(file.path);
    }

    await this.prisma.generatedFile.delete({ where: { id: fileId } });
  }
}
