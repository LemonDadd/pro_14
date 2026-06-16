import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GrowthRecordsService } from './growth-records.service';
import { CreateGrowthRecordDto } from './dto/create-growth-record.dto';
import { UpdateGrowthRecordDto } from './dto/update-growth-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('生长记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/growth-records')
export class GrowthRecordsController {
  constructor(private readonly service: GrowthRecordsService) {}

  @Post()
  @ApiOperation({ summary: '创建生长记录' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateGrowthRecordDto) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取生长记录列表' })
  @ApiQuery({ name: 'babyId', required: true, description: '宝宝ID' })
  @ApiQuery({ name: 'type', required: false, description: '类型过滤 weight/height', enum: ['weight', 'height'] })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('babyId') babyId: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll(user.userId, babyId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个生长记录' })
  @ApiParam({ name: 'id', description: '生长记录ID' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findOne(user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新生长记录' })
  @ApiParam({ name: 'id', description: '生长记录ID' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGrowthRecordDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除生长记录' })
  @ApiParam({ name: 'id', description: '生长记录ID' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
