import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({ description: '微信登录code' })
  @IsString()
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;

  @ApiPropertyOptional({ description: '微信昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: '微信头像URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
