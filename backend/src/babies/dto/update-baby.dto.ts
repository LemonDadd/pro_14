import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';

export class UpdateBabyDto {
  @ApiPropertyOptional({ description: '宝宝昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: '生日，格式 YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  birthday?: string;

  @ApiPropertyOptional({ description: '性别', enum: ['boy', 'girl'] })
  @IsIn(['boy', 'girl'])
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: '出生体重(kg)' })
  @IsNumber({}, { message: '出生体重必须是数字' })
  @Min(0.1)
  @Max(20)
  @IsOptional()
  birthWeight?: number;

  @ApiPropertyOptional({ description: '出生身长(cm)' })
  @IsNumber({}, { message: '出生身长必须是数字' })
  @Min(10)
  @Max(150)
  @IsOptional()
  birthHeight?: number;

  @ApiPropertyOptional({ description: '喂养偏好', enum: ['breast', 'formula', 'mixed'] })
  @IsIn(['breast', 'formula', 'mixed'])
  @IsOptional()
  feedPreference?: string;
}
