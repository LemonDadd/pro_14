import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';

export class FeedDataDto {
  @ApiPropertyOptional({ description: '奶量(ml)' })
  @IsNumber({}, { message: '奶量必须是数字' })
  @Min(0)
  @IsOptional()
  amountMl?: number;

  @ApiPropertyOptional({ description: '侧别', enum: ['L', 'R', 'bottle'] })
  @IsIn(['L', 'R', 'bottle'])
  @IsOptional()
  side?: string;

  @ApiPropertyOptional({ description: '时长(秒)' })
  @IsNumber({}, { message: '时长必须是数字' })
  @Min(0)
  @IsOptional()
  durationSec?: number;
}

export class DiaperDataDto {
  @ApiProperty({ description: '尿布类型', enum: ['wet', 'dirty', 'both'] })
  @IsIn(['wet', 'dirty', 'both'], { message: '尿布类型必须是 wet/dirty/both' })
  type: string;

  @ApiPropertyOptional({ description: '颜色备注' })
  @IsString()
  @IsOptional()
  colorNote?: string;
}

export class SleepDataDto {
  @ApiProperty({ description: '睡眠时长(秒)' })
  @IsNumber({}, { message: '时长必须是数字' })
  @Min(0)
  durationSec: number;
}

export class OtherDataDto {
  @ApiPropertyOptional({ description: '体温(°C)' })
  @IsNumber({}, { message: '体温必须是数字' })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ description: '用药' })
  @IsString()
  @IsOptional()
  medication?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: '宝宝ID' })
  @IsString()
  @IsNotEmpty({ message: '宝宝ID不能为空' })
  babyId: string;

  @ApiProperty({ description: '事件类型', enum: ['feed', 'diaper', 'sleep', 'other'] })
  @IsIn(['feed', 'diaper', 'sleep', 'other'], { message: '事件类型必须是 feed/diaper/sleep/other' })
  type: string;

  @ApiProperty({ description: '事件发生时间戳(毫秒)' })
  @IsNumber({}, { message: '时间戳必须是数字' })
  timestamp: number;

  @ApiPropertyOptional({ type: FeedDataDto, description: '喂奶数据（type=feed时必填）' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeedDataDto)
  feedData?: FeedDataDto;

  @ApiPropertyOptional({ type: DiaperDataDto, description: '尿布数据（type=diaper时必填）' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiaperDataDto)
  diaperData?: DiaperDataDto;

  @ApiPropertyOptional({ type: SleepDataDto, description: '睡眠数据（type=sleep时必填）' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepDataDto)
  sleepData?: SleepDataDto;

  @ApiPropertyOptional({ type: OtherDataDto, description: '其他数据' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtherDataDto)
  otherData?: OtherDataDto;

  @ApiPropertyOptional({ description: '自由备注' })
  @IsString()
  @IsOptional()
  note?: string;
}
