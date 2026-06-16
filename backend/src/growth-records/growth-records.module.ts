import { Module } from '@nestjs/common';
import { GrowthRecordsService } from './growth-records.service';
import { GrowthRecordsController } from './growth-records.controller';

@Module({
  controllers: [GrowthRecordsController],
  providers: [GrowthRecordsService],
  exports: [GrowthRecordsService],
})
export class GrowthRecordsModule {}
