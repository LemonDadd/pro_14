import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { ImportDataDto } from './dto/import-data.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('数据同步')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post('import')
  @ApiOperation({ summary: '批量导入本地数据' })
  importData(@CurrentUser() user: CurrentUserPayload, @Body() dto: ImportDataDto) {
    return this.service.importData(user.userId, dto);
  }

  @Get('export')
  @ApiOperation({ summary: '拉取全量数据导出' })
  exportData(@CurrentUser() user: CurrentUserPayload) {
    return this.service.exportData(user.userId);
  }
}
