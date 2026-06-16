import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscribeService } from './subscribe.service';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { SaveTemplateIdDto } from './dto/save-template-id.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('订阅消息')
@ApiBearerAuth()
@Controller('v1/subscribe')
export class SubscribeController {
  constructor(
    private readonly service: SubscribeService,
    private readonly scheduler: ReminderSchedulerService,
  ) {}

  @Post('save-template-id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '保存用户订阅的模板ID' })
  saveTemplateId(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SaveTemplateIdDto,
  ) {
    return this.service.saveTemplateId(user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取用户订阅状态' })
  getSubscription(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getSubscription(user.userId);
  }

  @Post('send-reminder')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '手动触发喂奶提醒（定时任务手动执行）' })
  sendReminder(@CurrentUser() user: CurrentUserPayload) {
    return this.scheduler.checkAndSendReminders(user.userId);
  }
}
