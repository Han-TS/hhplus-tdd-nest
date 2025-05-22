import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import { PointService } from './point.service';
import { PointDto } from './point.dto';
import { UserPoint } from './point.model';

@Controller('point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  /**
   * [GET] /point/:id
   * 유저 포인트 잔액 조회
   */
  @Get(':id')
  async getPoint(@Param('id') id: string): Promise<UserPoint> {
    return this.pointService.getBalance(Number(id));
  }

  /**
   * [GET] /point/:id/histories
   * 유저 포인트 내역 조회
   */
  @Get(':id/histories')
  async getHistories(@Param('id') id: string) {
    return this.pointService.getHistories(Number(id));
  }

  /**
   * [PATCH] /point/:id/charge
   * 유저 포인트 충전
   */
  @Patch(':id/charge')
  async charge(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: PointDto,
  ): Promise<UserPoint> {
    return this.pointService.charge(Number(id), dto.amount);
  }

  /**
   * [PATCH] /point/:id/use
   * 유저 포인트 사용
   */
  @Patch(':id/use')
  async use(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: PointDto,
  ): Promise<UserPoint> {
    return this.pointService.use(Number(id), dto.amount);
  }
}
