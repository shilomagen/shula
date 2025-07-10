import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { GroupMetricsService } from './group-metrics.service';
import { GroupMetricsController } from './group-metrics.controller';

@Module({
  imports: [PrismaModule],
  providers: [GroupMetricsService],
  controllers: [GroupMetricsController],
  exports: [GroupMetricsService],
})
export class GroupMetricsModule {}