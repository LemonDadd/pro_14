import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('用户设置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @ApiOperation({ summary: '获取用户设置' })
  getSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getSettings(user.userId);
  }

  @Put()
  @ApiOperation({ summary: '更新用户设置' })
  updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.service.updateSettings(user.userId, dto);
  }
}
