import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class SaveTemplateIdDto {
  @ApiProperty({ description: '微信订阅消息模板ID' })
  @IsString()
  @IsNotEmpty({ message: '模板ID不能为空' })
  templateId: string;

  @ApiPropertyOptional({ description: '是否启用订阅', default: true })
  @IsBoolean()
  @IsOptional()
  subscribed?: boolean;
}
