import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Service health check' })
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return { data: { status: 'ok', timestamp: new Date().toISOString() } };
  }
}
