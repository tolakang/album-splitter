import { Module } from '@nestjs/common';
import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { SplitProcessor } from './split.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio-processing' }),
  ],
  controllers: [SplitController],
  providers: [SplitService, SplitProcessor],
  exports: [SplitService],
})
export class SplitModule {}
