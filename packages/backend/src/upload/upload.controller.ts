import { Controller, Post, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import { join } from 'path';

const uploadDir = join(process.cwd(), 'storage', 'uploads');

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':albumId')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req: any, file: any, cb: any) => {
        const filename = `${req.params.albumId}-${file.originalname}`;
        cb(null, filename);
      },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  }))
  @ApiOperation({ summary: 'Upload audio file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadFile(
    @Param('albumId') albumId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: MP3, WAV, FLAC, OGG, M4A');
    }

    return this.uploadService.handleUploadedFile(file, albumId);
  }
}
