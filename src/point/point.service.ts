import { Injectable, BadRequestException } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { TransactionType, UserPoint } from './point.model';

/**
 * 유저 ID별 Promise 체인을 저장하는 Map
 * - 각 유저별로 동시 요청이 순차적으로 실행되도록 보장
 */
const userLocks = new Map<number, Promise<void>>();

/**
 * userId 별로 직렬 실행을 보장하는 유틸 함수
 * - 이전 요청이 끝난 후에 다음 요청을 실행
 */
function withUserLock<T>(userId: number, task: () => Promise<T>): Promise<T> {
  const prev = userLocks.get(userId) || Promise.resolve();
  const current = prev.then(() => task());
  userLocks.set(
    userId,
    current.then(
      () => {},
      () => {}, // 에러가 나도 체인 유지
    ),
  );
  return current;
}

@Injectable()
export class PointService {
  constructor(
    private readonly userPointTable: UserPointTable, // 유저 포인트 데이터 저장소
    private readonly pointHistoryTable: PointHistoryTable, // 포인트 내역 데이터 저장소
  ) {}

  /**
   * 유저 포인트 잔액 조회
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
   * 포인트 충전 (동시성 보장 포함)
   * - 금액 유효성 검사
   * - 포인트 누적
   * - 내역 기록
   */
  async charge(userId: number, amount: number): Promise<UserPoint> {
    return withUserLock(userId, async () => {
      if (amount <= 0) {
        throw new Error('충전 금액은 0보다 커야 합니다.');
      }

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
    });
  }

  /**
   * 포인트 사용 (동시성 보장 포함)
   * - 금액 유효성 검사
   * - 잔액 부족 시 예외 발생
   * - 포인트 차감
   * - 내역 기록
   */
  async use(userId: number, amount: number): Promise<UserPoint> {
    return withUserLock(userId, async () => {
      if (amount <= 0) {
        throw new Error('사용 금액은 0보다 커야 합니다.');
      }

      const current = await this.userPointTable.selectById(userId);
      if (current.point < amount) {
        throw new BadRequestException('잔액이 부족합니다.');
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
    });
  }
}
