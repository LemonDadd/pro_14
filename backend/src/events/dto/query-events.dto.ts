import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEventsDto {
  @ApiPropertyOptional({ description: '事件类型过滤', enum: ['feed', 'diaper', 'sleep', 'other'] })
  @IsIn(['feed', 'diaper', 'sleep', 'other'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '起始时间戳' })
  @IsNumber({}, { message: '起始时间戳必须是数字' })
  @Type(() => Number)
  @IsOptional()
  startTime?: number;

  @ApiPropertyOptional({ description: '结束时间戳' })
  @IsNumber({}, { message: '结束时间戳必须是数字' })
  @Type(() => Number)
  @IsOptional()
  endTime?: number;

  @ApiPropertyOptional({ description: '页码，默认1' })
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数，默认50' })
  @IsNumber({}, { message: '每页条数必须是数字' })
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  pageSize?: number;
}
