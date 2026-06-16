import { Injectable, Logger } from '@nestjs/common';

export interface WechatMessageData {
  thing1: { value: string };
  thing2: { value: string };
  thing3: { value: string };
}

export interface SendSubscribeMessageOptions {
  openid: string;
  templateId: string;
  data: WechatMessageData;
  page?: string;
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface SendMessageResponse {
  errcode: number;
  errmsg: string;
  msgid?: string;
}

@Injectable()
export class WechatMessageService {
  private readonly logger = new Logger(WechatMessageService.name);
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number = 0;

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.accessTokenExpiresAt > now) {
      return this.accessToken;
    }

    const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;

    if (!WECHAT_APP_ID || WECHAT_APP_ID === 'your_app_id' || process.env.NODE_ENV !== 'production') {
      this.logger.warn('微信 AppID 未配置，使用模拟 token');
      this.accessToken = 'mock_access_token';
      this.accessTokenExpiresAt = now + 7200 * 1000;
      return this.accessToken;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`;
    const res: AccessTokenResponse = await fetch(url).then((r) => r.json());

    if (res.errcode || !res.access_token) {
      throw new Error(`获取微信 access_token 失败: ${res.errmsg || '未知错误'}`);
    }

    this.accessToken = res.access_token;
    this.accessTokenExpiresAt = now + (res.expires_in || 7200) * 1000 - 300 * 1000;

    return this.accessToken;
  }

  async sendSubscribeMessage(options: SendSubscribeMessageOptions): Promise<boolean> {
    const { openid, templateId, data, page } = options;

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `[模拟发送] 订阅消息 -> openid: ${openid}, template: ${templateId}, data: ${JSON.stringify(data)}`,
      );
      return true;
    }

    try {
      const token = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`;

      const body = {
        touser: openid,
        template_id: templateId,
        page: page || 'pages/today/index',
        miniprogram_state: 'formal',
        lang: 'zh_CN',
        data,
      };

      const res: SendMessageResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());

      if (res.errcode !== 0) {
        this.logger.error(`发送订阅消息失败: openid=${openid}, errcode=${res.errcode}, errmsg=${res.errmsg}`);
        return false;
      }

      this.logger.log(`发送订阅消息成功: openid=${openid}, msgid=${res.msgid}`);
      return true;
    } catch (e) {
      this.logger.error(`发送订阅消息异常: ${e.message}`);
      return false;
    }
  }

  buildFeedReminderData(babyName: string, hoursSinceLastFeed: number, suggestion: string): WechatMessageData {
    const hoursText = hoursSinceLastFeed >= 1 ? `${hoursSinceLastFeed.toFixed(1)} 小时` : `${Math.round(hoursSinceLastFeed * 60)} 分钟`;
    return {
      thing1: { value: babyName },
      thing2: { value: hoursText },
      thing3: { value: suggestion },
    };
  }
}
