import { Module } from '@nestjs/common';
import { SplitService } from './split.service';
import { SplitProcessor } from './split.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio-processing' }),
  ],
  providers: [SplitService, SplitProcessor],
  exports: [SplitService],
})
export class SplitModule {}
