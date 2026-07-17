import { Module, forwardRef } from '@nestjs/common';
import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { SplitProcessor } from './split.processor';
import { BullModule } from '@nestjs/bullmq';
import { AlbumModule } from '../album/album.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio-processing' }),
    forwardRef(() => AlbumModule),
  ],
  controllers: [SplitController],
  providers: [SplitService, SplitProcessor],
  exports: [SplitService],
})
export class SplitModule {}
