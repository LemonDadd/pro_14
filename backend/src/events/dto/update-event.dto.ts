import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventDto, FeedDataDto, DiaperDataDto, SleepDataDto, OtherDataDto } from './create-event.dto';
import { IsOptional, ValidateNested, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @ApiPropertyOptional({ description: '事件类型', enum: ['feed', 'diaper', 'sleep', 'other'] })
  @IsIn(['feed', 'diaper', 'sleep', 'other'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '事件发生时间戳(毫秒)' })
  @IsNumber({}, { message: '时间戳必须是数字' })
  @Min(0)
  @IsOptional()
  timestamp?: number;

  @ApiPropertyOptional({ type: FeedDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeedDataDto)
  feedData?: FeedDataDto;

  @ApiPropertyOptional({ type: DiaperDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiaperDataDto)
  diaperData?: DiaperDataDto;

  @ApiPropertyOptional({ type: SleepDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepDataDto)
  sleepData?: SleepDataDto;

  @ApiPropertyOptional({ type: OtherDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtherDataDto)
  otherData?: OtherDataDto;

  @ApiPropertyOptional({ description: '自由备注' })
  @IsString()
  @IsOptional()
  note?: string;
}
