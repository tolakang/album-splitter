import { Controller, Get, Delete, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DownloadService } from './download.service';
import { Response } from 'express';

@ApiTags('download')
@Controller('api/download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get(':fileId')
  @ApiOperation({ summary: 'Download a single file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadFile(@Param('fileId') fileId: string, @Res({ passthrough: true }) res: Response) {
    return this.downloadService.downloadFile(fileId, res);
  }

  @Get('zip/:albumId')
  @ApiOperation({ summary: 'Download album as ZIP' })
  @ApiResponse({ status: 200, description: 'ZIP downloaded successfully' })
  async downloadZip(@Param('albumId') albumId: string, @Res({ passthrough: true }) res: Response) {
    return this.downloadService.downloadAlbumZip(albumId, res);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a generated file' })
  async deleteFile(@Param('fileId') fileId: string) {
    await this.downloadService.deleteFile(fileId);
  }
}
