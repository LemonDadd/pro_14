import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async wechatLogin(dto: WechatLoginDto) {
    let openid: string;

    if (process.env.NODE_ENV === 'production') {
      const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${dto.code}&grant_type=authorization_code`;
      const res = await fetch(url).then((r) => r.json());
      if (!res.openid) {
        throw new UnauthorizedException('微信登录失败');
      }
      openid = res.openid;
    } else {
      openid = `dev_${dto.code}`;
    }

    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: dto.nickname || '用户',
          avatarUrl: dto.avatarUrl,
        },
      });

      await this.prisma.appSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          feedReminderInterval: 3,
        },
        update: {},
      });
    } else if (dto.nickname || dto.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: dto.nickname ?? user.nickname,
          avatarUrl: dto.avatarUrl ?? user.avatarUrl,
        },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      openid: user.openid,
    });

    return {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.getTime(),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }
}
