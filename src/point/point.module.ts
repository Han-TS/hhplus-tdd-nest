import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';

@Module({
  controllers: [PointController],
  providers: [PointService, UserPointTable, PointHistoryTable],
})
export class PointModule {}
