import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    await this.validateBabyOwnership(userId, dto.babyId);
    this.validateEventData(dto.type, dto);

    const data: any = {
      userId,
      babyId: dto.babyId,
      type: dto.type,
      timestamp: BigInt(dto.timestamp),
      note: dto.note,
    };
    if (dto.id) data.id = dto.id;

    if (dto.feedData) data.feedData = JSON.stringify(dto.feedData);
    if (dto.diaperData) data.diaperData = JSON.stringify(dto.diaperData);
    if (dto.sleepData) data.sleepData = JSON.stringify(dto.sleepData);
    if (dto.otherData) data.otherData = JSON.stringify(dto.otherData);

    const event = await this.prisma.babyEvent.create({ data });
    return this.formatEvent(event);
  }

  async findAll(userId: string, babyId: string, query: QueryEventsDto) {
    await this.validateBabyOwnership(userId, babyId);

    const where: any = { userId, babyId };
    if (query.type) where.type = query.type;
    if (query.startTime) where.timestamp = { ...where.timestamp, gte: BigInt(query.startTime) };
    if (query.endTime) where.timestamp = { ...where.timestamp, lte: BigInt(query.endTime) };

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.babyEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.babyEvent.count({ where }),
    ]);

    return {
      items: items.map((e) => this.formatEvent(e)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.babyEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('事件不存在');
    if (event.userId !== userId) throw new ForbiddenException('无权限访问');
    return this.formatEvent(event);
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.babyEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('事件不存在');
    if (existing.userId !== userId) throw new ForbiddenException('无权限访问');

    const type = dto.type || existing.type;
    if (dto.type) {
      this.validateEventData(type, dto as any);
    }

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.timestamp !== undefined) data.timestamp = BigInt(dto.timestamp);
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.feedData !== undefined) data.feedData = JSON.stringify(dto.feedData);
    if (dto.diaperData !== undefined) data.diaperData = JSON.stringify(dto.diaperData);
    if (dto.sleepData !== undefined) data.sleepData = JSON.stringify(dto.sleepData);
    if (dto.otherData !== undefined) data.otherData = JSON.stringify(dto.otherData);

    const event = await this.prisma.babyEvent.update({ where: { id }, data });
    return this.formatEvent(event);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.babyEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('事件不存在');
    if (existing.userId !== userId) throw new ForbiddenException('无权限访问');
    await this.prisma.babyEvent.delete({ where: { id } });
    return null;
  }

  async getTodaySummary(userId: string, babyId: string) {
    await this.validateBabyOwnership(userId, babyId);

    const startOfDay = dayjs().startOf('day').valueOf();
    const endOfDay = dayjs().endOf('day').valueOf();

    const events = await this.prisma.babyEvent.findMany({
      where: {
        userId,
        babyId,
        timestamp: { gte: BigInt(startOfDay), lte: BigInt(endOfDay) },
      },
      orderBy: { timestamp: 'asc' },
    });

    let totalMl = 0;
    let feedCount = 0;
    let diaperCount = 0;
    let sleepTotalSec = 0;
    const sideCounts: Record<string, number> = { L: 0, R: 0, bottle: 0 };
    let lastFeedAt: number | null = null;

    for (const e of events) {
      if (e.type === 'feed') {
        feedCount++;
        const fd = e.feedData ? JSON.parse(e.feedData) : null;
        if (fd?.amountMl) totalMl += fd.amountMl;
        if (fd?.side && sideCounts[fd.side] !== undefined) sideCounts[fd.side]++;
        lastFeedAt = Number(e.timestamp);
      } else if (e.type === 'diaper') {
        diaperCount++;
      } else if (e.type === 'sleep') {
        const sd = e.sleepData ? JSON.parse(e.sleepData) : null;
        if (sd?.durationSec) sleepTotalSec += sd.durationSec;
      }
    }

    return {
      totalMl,
      feedCount,
      diaperCount,
      sleepTotalSec,
      sideCounts,
      lastFeedAt,
    };
  }

  async getWeekSummary(userId: string, babyId: string) {
    await this.validateBabyOwnership(userId, babyId);

    const dailyStats: any[] = [];
    const labels = ['6天前', '5天前', '4天前', '3天前', '2天前', '昨天', '今天'];

    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const start = date.startOf('day').valueOf();
      const end = date.endOf('day').valueOf();

      const events = await this.prisma.babyEvent.findMany({
        where: {
          userId,
          babyId,
          timestamp: { gte: BigInt(start), lte: BigInt(end) },
        },
      });

      let totalMl = 0;
      let feedCount = 0;
      let diaperCount = 0;
      let sleepSec = 0;

      for (const e of events) {
        if (e.type === 'feed') {
          feedCount++;
          const fd = e.feedData ? JSON.parse(e.feedData) : null;
          if (fd?.amountMl) totalMl += fd.amountMl;
        } else if (e.type === 'diaper') {
          diaperCount++;
        } else if (e.type === 'sleep') {
          const sd = e.sleepData ? JSON.parse(e.sleepData) : null;
          if (sd?.durationSec) sleepSec += sd.durationSec;
        }
      }

      dailyStats.push({
        date: date.format('YYYY-MM-DD'),
        label: labels[6 - i],
        totalMl,
        feedCount,
        diaperCount,
        sleepSec,
      });
    }

    return { dailyStats };
  }

  private async validateBabyOwnership(userId: string, babyId: string) {
    const baby = await this.prisma.baby.findUnique({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('宝宝不存在');
    if (baby.userId !== userId) throw new ForbiddenException('无权限访问');
  }

  private validateEventData(type: string, dto: CreateEventDto | UpdateEventDto) {
    if (type === 'diaper' && !(dto as any).diaperData) {
      throw new UnprocessableEntityException('尿布事件必须提供 diaperData');
    }
    if (type === 'sleep' && !(dto as any).sleepData) {
      throw new UnprocessableEntityException('睡眠事件必须提供 sleepData');
    }
  }

  private formatEvent(event: any) {
    return {
      id: event.id,
      userId: event.userId,
      babyId: event.babyId,
      type: event.type,
      timestamp: Number(event.timestamp),
      feedData: event.feedData ? JSON.parse(event.feedData) : undefined,
      diaperData: event.diaperData ? JSON.parse(event.diaperData) : undefined,
      sleepData: event.sleepData ? JSON.parse(event.sleepData) : undefined,
      otherData: event.otherData ? JSON.parse(event.otherData) : undefined,
      note: event.note,
      createdAt: event.createdAt.getTime(),
      updatedAt: event.updatedAt.getTime(),
    };
  }
}
