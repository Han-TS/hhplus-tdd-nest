import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { TransactionType, UserPoint } from './point.model';

@Injectable()
export class PointService {
  constructor(
    private readonly userPointTable: UserPointTable,
    private readonly pointHistoryTable: PointHistoryTable,
  ) {}

  /**
   * 유저의 현재 포인트 잔액 조회
   */
  async getBalance(userId: number): Promise<UserPoint> {
    return this.userPointTable.selectById(userId);
  }

  /**
   * 유저의 포인트 충전/사용 내역 조회
   */
  async getHistories(userId: number) {
    return this.pointHistoryTable.selectAllByUserId(userId);
  }

  /**
   * 포인트 충전
   */
  async charge(userId: number, amount: number): Promise<UserPoint> {
    const current = await this.userPointTable.selectById(userId);
    const next = current.point + amount;

    const updated = await this.userPointTable.insertOrUpdate(userId, next);

    await this.pointHistoryTable.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      updated.updateMillis,
    );

    return updated;
  }

  /**
   * 포인트 사용
   */
  async use(userId: number, amount: number): Promise<UserPoint> {
    const current = await this.userPointTable.selectById(userId);
    if (current.point < amount) {
      throw new Error('잔액이 부족합니다.');
    }

    const next = current.point - amount;

    const updated = await this.userPointTable.insertOrUpdate(userId, next);

    await this.pointHistoryTable.insert(
      userId,
      amount,
      TransactionType.USE,
      updated.updateMillis,
    );

    return updated;
  }
}
