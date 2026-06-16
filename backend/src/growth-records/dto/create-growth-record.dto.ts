import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateGrowthRecordDto {
  @ApiProperty({ description: '宝宝ID' })
  @IsString()
  @IsNotEmpty({ message: '宝宝ID不能为空' })
  babyId: string;

  @ApiProperty({ description: '测量日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty({ message: '测量日期不能为空' })
  date: string;

  @ApiProperty({ description: '体重(kg)' })
  @IsNumber({}, { message: '体重必须是数字' })
  @Min(0.1, { message: '体重不合法' })
  @Max(100, { message: '体重不合法' })
  weight: number;

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
