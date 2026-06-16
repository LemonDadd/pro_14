import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateGrowthRecordDto {
  @ApiPropertyOptional({ description: '测量日期' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: '体重(kg)' })
  @IsNumber({}, { message: '体重必须是数字' })
  @Min(0.1)
  @Max(100)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: '身长(cm)' })
  @IsNumber({}, { message: '身长必须是数字' })
  @Min(10)
  @Max(200)
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  note?: string;
}
