import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WechatMessageService } from './wechat-message.service';
import * as dayjs from 'dayjs';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wechatMessageService: WechatMessageService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'feed-reminder-check',
    timeZone: 'Asia/Shanghai',
  })
  async handleFeedReminderCron() {
    this.logger.log('定时任务开始：扫描需要喂奶提醒的用户');
    const result = await this.checkAndSendReminders();
    this.logger.log(`定时任务结束：共扫描 ${result.scanned} 人，发送 ${result.sent} 条提醒`);
    return result;
  }

  async checkAndSendReminders(specificUserId?: string) {
    const now = Date.now();
    const cooldownMs = (parseFloat(process.env.REMINDER_COOLDOWN_HOURS || '2')) * 60 * 60 * 1000;

    const where: any = { subscribed: true };
    if (specificUserId) where.userId = specificUserId;

    const subscriptions = await this.prisma.userSubscription.findMany({
      where,
      include: {
        user: {
          include: {
            settings: true,
            babies: true,
          },
        },
      },
    });

    let sentCount = 0;

    for (const sub of subscriptions) {
      const settings = sub.user.settings;
      const baby = sub.user.babies[0];
      const currentBabyId = settings?.currentBabyId || baby?.id;

      if (!currentBabyId) continue;

      const currentBaby = sub.user.babies.find((b) => b.id === currentBabyId) || baby;
      if (!currentBaby) continue;

      const thresholdHours = settings?.feedReminderInterval || 3;
      const thresholdMs = thresholdHours * 60 * 60 * 1000;

      const lastFeed = await this.prisma.babyEvent.findFirst({
        where: {
          userId: sub.userId,
          babyId: currentBabyId,
          type: 'feed',
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      const lastFeedTime = lastFeed ? Number(lastFeed.timestamp) : null;
      const lastReminderSent = sub.lastReminderSentAt ? Number(sub.lastReminderSentAt) : null;

      if (!lastFeedTime) continue;

      const hoursSinceLastFeed = (now - lastFeedTime) / (1000 * 60 * 60);

      if (hoursSinceLastFeed >= thresholdHours) {
        const cooldownOk = !lastReminderSent || now - lastReminderSent >= cooldownMs;

        if (cooldownOk) {
          const suggestion = `距上次喂奶已超过 ${thresholdHours} 小时，建议给宝宝喂奶了哦~`;
          const data = this.wechatMessageService.buildFeedReminderData(
            currentBaby.nickname,
            hoursSinceLastFeed,
            suggestion,
          );

          const sent = await this.wechatMessageService.sendSubscribeMessage({
            openid: sub.user.openid,
            templateId: sub.templateId,
            data,
          });

          if (sent) {
            sentCount++;
            await this.prisma.userSubscription.update({
              where: { id: sub.id },
              data: { lastReminderSentAt: BigInt(now) },
            });
          }
        }
      }
    }

    return {
      scanned: subscriptions.length,
      sent: sentCount,
      timestamp: now,
    };
  }
}
