import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.appSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await this.prisma.appSettings.create({
        data: { userId, feedReminderInterval: 3 },
      });
    }
    return {
      userId: settings.userId,
      feedReminderInterval: settings.feedReminderInterval,
      currentBabyId: settings.currentBabyId,
      updatedAt: settings.updatedAt.getTime(),
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    if (dto.currentBabyId) {
      const baby = await this.prisma.baby.findUnique({
        where: { id: dto.currentBabyId },
      });
      if (!baby || baby.userId !== userId) {
        throw new ForbiddenException('宝宝不存在或无权限');
      }
    }
    const settings = await this.prisma.appSettings.upsert({
      where: { userId },
      create: { userId, ...dto, feedReminderInterval: dto.feedReminderInterval ?? 3 },
      update: dto,
    });
    return {
      userId: settings.userId,
      feedReminderInterval: settings.feedReminderInterval,
      currentBabyId: settings.currentBabyId,
      updatedAt: settings.updatedAt.getTime(),
    };
  }
}
