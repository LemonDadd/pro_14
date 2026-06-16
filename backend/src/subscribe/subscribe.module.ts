import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscribeService } from './subscribe.service';
import { SubscribeController } from './subscribe.controller';
import { WechatMessageService } from './services/wechat-message.service';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SubscribeController],
  providers: [SubscribeService, WechatMessageService, ReminderSchedulerService],
  exports: [SubscribeService, ReminderSchedulerService, WechatMessageService],
})
export class SubscribeModule {}
