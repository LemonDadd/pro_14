import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBabyDto } from './dto/create-baby.dto';
import { UpdateBabyDto } from './dto/update-baby.dto';
import { generateAvatarColor } from './utils/avatar.util';

@Injectable()
export class BabiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBabyDto) {
    const baby = await this.prisma.baby.create({
      data: {
        userId,
        ...dto,
        avatarColor: generateAvatarColor(dto.nickname + Date.now()),
      },
    });

    const settings = await this.prisma.appSettings.findUnique({
      where: { userId },
    });

    if (!settings?.currentBabyId) {
      await this.prisma.appSettings.update({
        where: { userId },
        data: { currentBabyId: baby.id },
      });
    }

    return this.formatBaby(baby);
  }

  async findAll(userId: string) {
    const babies = await this.prisma.baby.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return babies.map((b) => this.formatBaby(b));
  }

  async findOne(userId: string, id: string) {
    const baby = await this.prisma.baby.findUnique({ where: { id } });
    if (!baby) {
      throw new NotFoundException('宝宝不存在');
    }
    if (baby.userId !== userId) {
      throw new ForbiddenException('无权限访问');
    }
    return this.formatBaby(baby);
  }

  async update(userId: string, id: string, dto: UpdateBabyDto) {
    await this.findOne(userId, id);
    const baby = await this.prisma.baby.update({
      where: { id },
      data: dto,
    });
    return this.formatBaby(baby);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.baby.delete({ where: { id } });

    const settings = await this.prisma.appSettings.findUnique({
      where: { userId },
    });

    if (settings?.currentBabyId === id) {
      const remaining = await this.prisma.baby.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      await this.prisma.appSettings.update({
        where: { userId },
        data: { currentBabyId: remaining?.id || null },
      });
    }

    return null;
  }

  async setCurrent(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.appSettings.update({
      where: { userId },
      data: { currentBabyId: id },
    });
    return { success: true };
  }

  private formatBaby(baby: any) {
    return {
      id: baby.id,
      userId: baby.userId,
      nickname: baby.nickname,
      birthday: baby.birthday,
      gender: baby.gender,
      birthWeight: baby.birthWeight,
      birthHeight: baby.birthHeight,
      feedPreference: baby.feedPreference,
      avatarColor: baby.avatarColor,
      createdAt: baby.createdAt.getTime(),
      updatedAt: baby.updatedAt.getTime(),
    };
  }
}
