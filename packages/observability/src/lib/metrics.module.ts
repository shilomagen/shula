import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Global() // Make the module global so services can be accessed anywhere
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
