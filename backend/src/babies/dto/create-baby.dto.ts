import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsIn, Min, Max, IsOptional, IsUUID } from 'class-validator';

export class CreateBabyDto {
  @ApiPropertyOptional({ description: '指定 ID（导入/同步时使用，不传则自动生成）' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: '宝宝昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @ApiProperty({ description: '生日，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty({ message: '生日不能为空' })
  birthday: string;

  @ApiProperty({ description: '性别', enum: ['boy', 'girl'] })
  @IsIn(['boy', 'girl'], { message: '性别必须是 boy 或 girl' })
  gender: string;

  @ApiProperty({ description: '出生体重(kg)' })
  @IsNumber({}, { message: '出生体重必须是数字' })
  @Min(0.1, { message: '出生体重不合法' })
  @Max(20, { message: '出生体重不合法' })
  birthWeight: number;

  @ApiProperty({ description: '出生身长(cm)' })
  @IsNumber({}, { message: '出生身长必须是数字' })
  @Min(10, { message: '出生身长不合法' })
  @Max(150, { message: '出生身长不合法' })
  birthHeight: number;

  @ApiProperty({ description: '喂养偏好', enum: ['breast', 'formula', 'mixed'] })
  @IsIn(['breast', 'formula', 'mixed'], { message: '喂养偏好必须是 breast/formula/mixed' })
  feedPreference: string;

  @ApiPropertyOptional({ description: '头像颜色' })
  @IsOptional()
  @IsString()
  avatarColor?: string;

  @ApiPropertyOptional({ description: '创建时间戳（导入时使用）' })
  @IsOptional()
  @IsNumber()
  createdAt?: number;
}
