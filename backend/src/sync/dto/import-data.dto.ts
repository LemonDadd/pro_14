import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, ValidateNested, IsNumber, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class SyncBabyDto {
  @ApiProperty({ description: '宝宝ID（可选，后端重新生成' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty() nickname: string;
  @ApiProperty() birthday: string;
  @ApiProperty() gender: string;
  @ApiProperty() birthWeight: number;
  @ApiProperty() birthHeight: number;
  @ApiProperty() feedPreference: string;
  @ApiPropertyOptional() avatarColor?: string;
  @ApiPropertyOptional() createdAt?: number;
}

class SyncFeedDataDto {
  @ApiPropertyOptional() amountMl?: number;
  @ApiPropertyOptional() side?: string;
  @ApiPropertyOptional() durationSec?: number;
}
class SyncDiaperDataDto {
  @ApiProperty() type: string;
  @ApiPropertyOptional() colorNote?: string;
}
class SyncSleepDataDto {
  @ApiProperty() durationSec: number;
}
class SyncOtherDataDto {
  @ApiPropertyOptional() temperature?: number;
  @ApiPropertyOptional() medication?: string;
  @ApiPropertyOptional() note?: string;
}

class SyncEventDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() babyId: string;
  @ApiProperty() type: string;
  @ApiProperty() timestamp: number;
  @ApiPropertyOptional({ type: SyncFeedDataDto })
  @ValidateNested() @Type(() => SyncFeedDataDto)
  @IsOptional()
  feedData?: SyncFeedDataDto;
  @ApiPropertyOptional({ type: SyncDiaperDataDto })
  @ValidateNested() @Type(() => SyncDiaperDataDto)
  @IsOptional()
  diaperData?: SyncDiaperDataDto;
  @ApiPropertyOptional({ type: SyncSleepDataDto })
  @ValidateNested() @Type(() => SyncSleepDataDto)
  @IsOptional()
  sleepData?: SyncSleepDataDto;
  @ApiPropertyOptional({ type: SyncOtherDataDto })
  @ValidateNested() @Type(() => SyncOtherDataDto)
  @IsOptional()
  otherData?: SyncOtherDataDto;
  @ApiPropertyOptional() note?: string;
  @ApiPropertyOptional() createdAt?: number;
}

class SyncGrowthRecordDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() babyId: string;
  @ApiProperty() date: string;
  @ApiProperty() weight: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() note?: string;
  @ApiPropertyOptional() createdAt?: number;
}

class SyncSettingsDto {
  @ApiPropertyOptional({ description: '喂奶间隔阈值' })
  feedReminderInterval?: number;
  @ApiPropertyOptional({ description: '当前选中的宝宝ID' })
  currentBabyId?: string | null;
}

export class ImportDataDto {
  @ApiProperty({ type: [SyncBabyDto], description: '宝宝列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncBabyDto)
  babies: SyncBabyDto[];

  @ApiProperty({ type: [SyncEventDto], description: '事件列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events: SyncEventDto[];

  @ApiProperty({ type: [SyncGrowthRecordDto], description: '生长记录列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncGrowthRecordDto)
  growthRecords: SyncGrowthRecordDto[];

  @ApiProperty({ type: SyncSettingsDto, description: '用户设置' })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncSettingsDto)
  settings: SyncSettingsDto;
}
