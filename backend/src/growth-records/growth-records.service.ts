import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrowthRecordDto } from './dto/create-growth-record.dto';
import { UpdateGrowthRecordDto } from './dto/update-growth-record.dto';

@Injectable()
export class GrowthRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGrowthRecordDto) {
    await this.validateBabyOwnership(userId, dto.babyId);
    const record = await this.prisma.growthRecord.create({
      data: { userId, ...dto },
    });
    return this.format(record);
  }

  async findAll(userId: string, babyId: string, type?: string) {
    await this.validateBabyOwnership(userId, babyId);
    const where: any = { userId, babyId };
    if (type === 'weight') where.height = null;
    if (type === 'height') {
      where.NOT = [{ height: null }];
    }
    const records = await this.prisma.growthRecord.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return records.map((r) => this.format(r));
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.growthRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('生长记录不存在');
    if (record.userId !== userId) throw new ForbiddenException('无权限访问');
    return this.format(record);
  }

  async update(userId: string, id: string, dto: UpdateGrowthRecordDto) {
    await this.findOne(userId, id);
    const record = await this.prisma.growthRecord.update({
      where: { id },
      data: dto,
    });
    return this.format(record);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.growthRecord.delete({ where: { id } });
    return null;
  }

  private async validateBabyOwnership(userId: string, babyId: string) {
    const baby = await this.prisma.baby.findUnique({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('宝宝不存在');
    if (baby.userId !== userId) throw new ForbiddenException('无权限访问');
  }

  private format(r: any) {
    return {
      id: r.id,
      userId: r.userId,
      babyId: r.babyId,
      date: r.date,
      weight: r.weight,
      height: r.height,
      note: r.note,
      createdAt: r.createdAt.getTime(),
      updatedAt: r.updatedAt.getTime(),
    };
  }
}
