import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ImportDataDto } from './dto/import-data.dto';
import { generateAvatarColor } from '../babies/utils/avatar.util';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async importData(userId: string, dto: ImportDataDto) {
    const idMapping = new Map<string, string>();
    let importedBabies = 0;
    let importedEvents = 0;
    let importedGrowthRecords = 0;

    return this.prisma.$transaction(async (tx) => {
      for (const b of dto.babies || []) {
        const oldId = b.id || `tmp_${importedBabies}`;
        const newBaby = await tx.baby.create({
          data: {
            userId,
            nickname: b.nickname,
            birthday: b.birthday,
            gender: b.gender,
            birthWeight: b.birthWeight,
            birthHeight: b.birthHeight,
            feedPreference: b.feedPreference,
            avatarColor: b.avatarColor || generateAvatarColor(b.nickname + Math.random()),
            createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
          },
        });
        idMapping.set(oldId, newBaby.id);
        importedBabies++;
      }

      for (const e of dto.events || []) {
        const newBabyId = idMapping.get(e.babyId) || e.babyId;
        if (!newBabyId) continue;

        const data: any = {
          userId,
          babyId: newBabyId,
          type: e.type,
          timestamp: BigInt(e.timestamp),
          note: e.note,
          createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
        };
        if (e.feedData) data.feedData = JSON.stringify(e.feedData);
        if (e.diaperData) data.diaperData = JSON.stringify(e.diaperData);
        if (e.sleepData) data.sleepData = JSON.stringify(e.sleepData);
        if (e.otherData) data.otherData = JSON.stringify(e.otherData);

        await tx.babyEvent.create({ data });
        importedEvents++;
      }

      for (const g of dto.growthRecords || []) {
        const newBabyId = idMapping.get(g.babyId) || g.babyId;
        if (!newBabyId) continue;

        await tx.growthRecord.create({
          data: {
            userId,
            babyId: newBabyId,
            date: g.date,
            weight: g.weight,
            height: g.height,
            note: g.note,
            createdAt: g.createdAt ? new Date(g.createdAt) : undefined,
          },
        });
        importedGrowthRecords++;
      }

      if (dto.settings) {
        let currentBabyId: string | null = null;
        if (dto.settings.currentBabyId) {
          currentBabyId = idMapping.get(dto.settings.currentBabyId) || null;
        }
        await tx.appSettings.upsert({
          where: { userId },
          create: {
            userId,
            feedReminderInterval: dto.settings.feedReminderInterval ?? 3,
            currentBabyId,
          },
          update: {
            feedReminderInterval: dto.settings.feedReminderInterval ?? 3,
            currentBabyId,
          },
        });
      }

      return { importedBabies, importedEvents, importedGrowthRecords };
    });
  }

  async exportData(userId: string) {
    const [babies, events, growthRecords, settings] = await Promise.all([
      this.prisma.baby.findMany({ where: { userId } }),
      this.prisma.babyEvent.findMany({ where: { userId } }),
      this.prisma.growthRecord.findMany({ where: { userId } }),
      this.prisma.appSettings.findUnique({ where: { userId } }),
    ]);

    return {
      babies: babies.map((b) => ({
        id: b.id,
        nickname: b.nickname,
        birthday: b.birthday,
        gender: b.gender,
        birthWeight: b.birthWeight,
        birthHeight: b.birthHeight,
        feedPreference: b.feedPreference,
        avatarColor: b.avatarColor,
        createdAt: b.createdAt.getTime(),
      })),
      events: events.map((e) => ({
        id: e.id,
        babyId: e.babyId,
        type: e.type,
        timestamp: Number(e.timestamp),
        feedData: e.feedData ? JSON.parse(e.feedData) : undefined,
        diaperData: e.diaperData ? JSON.parse(e.diaperData) : undefined,
        sleepData: e.sleepData ? JSON.parse(e.sleepData) : undefined,
        otherData: e.otherData ? JSON.parse(e.otherData) : undefined,
        note: e.note,
        createdAt: e.createdAt.getTime(),
      })),
      growthRecords: growthRecords.map((g) => ({
        id: g.id,
        babyId: g.babyId,
        date: g.date,
        weight: g.weight,
        height: g.height,
        note: g.note,
        createdAt: g.createdAt.getTime(),
      })),
      settings: settings
        ? {
            feedReminderInterval: settings.feedReminderInterval,
            currentBabyId: settings.currentBabyId,
          }
        : { feedReminderInterval: 3, currentBabyId: null },
    };
  }
}
