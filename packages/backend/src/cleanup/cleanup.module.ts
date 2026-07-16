import { Module } from '@nestjs/common';
import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';
import { SplitModule } from '../split/split.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    SplitModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CleanupController],
  providers: [CleanupService],
  exports: [CleanupService],
})
export class CleanupModule {}
