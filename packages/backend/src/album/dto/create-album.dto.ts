import { IsString, IsOptional, IsUrl, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TrackDto {
  @ApiProperty({ description: 'Track title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Start timestamp in seconds' })
  @IsNumber()
  startTimestamp!: number;
}

export class CreateAlbumDto {
  @ApiPropertyOptional({ description: 'Album title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'YouTube URL' })
  @IsUrl()
  @IsOptional()
  youtubeUrl?: string;

  @ApiPropertyOptional({ description: 'Track list' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  @IsOptional()
  tracks?: TrackDto[];
}
