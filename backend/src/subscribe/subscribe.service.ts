import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveTemplateIdDto } from './dto/save-template-id.dto';

@Injectable()
export class SubscribeService {
  constructor(private readonly prisma: PrismaService) {}

  async saveTemplateId(userId: string, dto: SaveTemplateIdDto) {
    const subscription = await this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        templateId: dto.templateId,
        subscribed: dto.subscribed !== false,
      },
      update: {
        templateId: dto.templateId,
        subscribed: dto.subscribed !== false,
      },
    });

    return this.format(subscription);
  }

  async getSubscription(userId: string) {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });
    if (!sub) {
      return {
        userId,
        templateId: null,
        subscribed: false,
        lastReminderSentAt: null,
      };
    }
    return this.format(sub);
  }

  async toggleSubscription(userId: string, subscribed: boolean) {
    const sub = await this.prisma.userSubscription.update({
      where: { userId },
      data: { subscribed },
    });
    return this.format(sub);
  }

  private format(sub: any) {
    return {
      userId: sub.userId,
      templateId: sub.templateId,
      subscribed: sub.subscribed,
      lastReminderSentAt: sub.lastReminderSentAt ? Number(sub.lastReminderSentAt) : null,
      createdAt: sub.createdAt?.getTime() || Date.now(),
      updatedAt: sub.updatedAt?.getTime() || Date.now(),
    };
  }
}
