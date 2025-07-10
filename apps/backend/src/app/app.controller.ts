import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get application data',
    operationId: 'getApplicationData',
  })
  @ApiResponse({
    status: 200,
    description: 'Application data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Welcome to backend!',
        },
      },
    },
  })
  getData(): { message: string } {
    return this.appService.getData();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get application health status',
    operationId: 'getHealthStatus',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
      },
    },
  })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
