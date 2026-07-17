import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CleanupService } from './cleanup.service';

@ApiTags('cleanup')
@Controller('cleanup')
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manual cleanup of expired files' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async triggerCleanup() {
    return this.cleanupService.manualCleanup();
  }
}
