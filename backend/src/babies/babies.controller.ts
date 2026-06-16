import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BabiesService } from './babies.service';
import { CreateBabyDto } from './dto/create-baby.dto';
import { UpdateBabyDto } from './dto/update-baby.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('宝宝档案')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/babies')
export class BabiesController {
  constructor(private readonly babiesService: BabiesService) {}

  @Post()
  @ApiOperation({ summary: '创建宝宝档案' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateBabyDto) {
    return this.babiesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取宝宝列表' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.babiesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个宝宝详情' })
  @ApiParam({ name: 'id', description: '宝宝ID' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.babiesService.findOne(user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新宝宝档案' })
  @ApiParam({ name: 'id', description: '宝宝ID' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBabyDto,
  ) {
    return this.babiesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除宝宝档案（级联删除关联数据）' })
  @ApiParam({ name: 'id', description: '宝宝ID' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.babiesService.remove(user.userId, id);
  }

  @Post(':id/set-current')
  @ApiOperation({ summary: '切换当前宝宝' })
  @ApiParam({ name: 'id', description: '宝宝ID' })
  setCurrent(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.babiesService.setCurrent(user.userId, id);
  }
}
