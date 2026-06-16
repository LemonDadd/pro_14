import { Module } from '@nestjs/common';
import { BabiesService } from './babies.service';
import { BabiesController } from './babies.controller';

@Module({
  controllers: [BabiesController],
  providers: [BabiesService],
  exports: [BabiesService],
})
export class BabiesModule {}
