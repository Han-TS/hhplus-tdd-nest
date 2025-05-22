// 사용자 포인트 상태 모델
export type UserPoint = {
  id: number;
  point: number;
  updateMillis: number;
};

/**
 * 포인트 트랜잭션 종류
 * - CHARGE : 충전
 * - USE : 사용
 */
// 포인트 거래 타입 정의 (충전 / 사용)
export enum TransactionType {
  CHARGE,
  USE,
}

// 포인트 내역 모델
export type PointHistory = {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  timeMillis: number;
};
