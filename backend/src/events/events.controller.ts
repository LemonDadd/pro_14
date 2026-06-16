import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('事件记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: '创建事件' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取事件列表' })
  @ApiQuery({ name: 'babyId', required: true, description: '宝宝ID' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('babyId') babyId: string,
    @Query() query: QueryEventsDto,
  ) {
    return this.eventsService.findAll(user.userId, babyId, query);
  }

  @Get('summary/today')
  @ApiOperation({ summary: '获取今日汇总数据' })
  @ApiQuery({ name: 'babyId', required: true, description: '宝宝ID' })
  getTodaySummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('babyId') babyId: string,
  ) {
    return this.eventsService.getTodaySummary(user.userId, babyId);
  }

  @Get('summary/week')
  @ApiOperation({ summary: '获取近7天汇总数据' })
  @ApiQuery({ name: 'babyId', required: true, description: '宝宝ID' })
  getWeekSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('babyId') babyId: string,
  ) {
    return this.eventsService.getWeekSummary(user.userId, babyId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个事件详情' })
  @ApiParam({ name: 'id', description: '事件ID' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.eventsService.findOne(user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新事件' })
  @ApiParam({ name: 'id', description: '事件ID' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除事件' })
  @ApiParam({ name: 'id', description: '事件ID' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.eventsService.remove(user.userId, id);
  }
}
