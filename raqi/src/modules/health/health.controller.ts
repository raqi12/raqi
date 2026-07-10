import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { HealthDataDto } from '../../common/swagger/responses/error.response';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Service health check',
    description:
      'Returns API readiness status and server timestamp. No authentication required. Use for load balancers and uptime monitoring.',
  })
  @ApiOkDataResponse(HealthDataDto, 'Service is healthy')
  @ApiStandardErrorResponses()
  getHealth() {
    return { data: { status: 'ok', timestamp: new Date().toISOString() } };
  }
}
