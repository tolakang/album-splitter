import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlbumDto {
  @ApiPropertyOptional({ description: 'Album title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'YouTube URL' })
  @IsUrl()
  @IsOptional()
  youtubeUrl?: string;
}
