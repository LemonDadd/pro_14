import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: '喂奶间隔阈值(小时)', enum: [2, 2.5, 3, 3.5, 4] })
  @IsIn([2, 2.5, 3, 3.5, 4], { message: '喂奶间隔阈值必须是 2/2.5/3/3.5/4' })
  @IsNumber({}, { message: '喂奶间隔阈值必须是数字' })
  @IsOptional()
  feedReminderInterval?: number;

  @ApiPropertyOptional({ description: '当前选中的宝宝ID' })
  @IsString()
  @IsOptional()
  currentBabyId?: string;
}
