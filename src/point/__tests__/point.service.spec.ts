import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { Test } from '@nestjs/testing';

describe('PointService 단위 테스트', () => {
  let service: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  // 테스트 실행 전 NestJS DI 컨테이너 구성
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PointService, UserPointTable, PointHistoryTable],
    }).compile();

    service = moduleRef.get(PointService);
    userPointTable = moduleRef.get(UserPointTable);
    pointHistoryTable = moduleRef.get(PointHistoryTable);

    // 매 테스트 전 유저 포인트 0으로 초기화
    await userPointTable.insertOrUpdate(1, 0);
  });

  it('사용자 포인트 잔액 조회 가능', async () => {
    const userId = 1;

    const result = await service.getBalance(userId);

    expect(result).toHaveProperty('id', userId);
    expect(typeof result.point).toBe('number');
  });

  it('사용자 포인트 충전 가능', async () => {
    const userId = 1;
    const chargeAmount = 5000;

    const result = await service.charge(userId, chargeAmount);

    expect(result.id).toBe(userId);
    expect(result.point).toBeGreaterThanOrEqual(chargeAmount);
  });

  it('사용자 포인트 사용 가능', async () => {
    const userId = 1;

    // 먼저 충분한 포인트를 충전
    await service.charge(userId, 10000);

    // 그 후 일부 포인트를 사용
    const result = await service.use(userId, 3000);

    expect(result.id).toBe(userId);
    expect(result.point).toBeGreaterThanOrEqual(0);
  });

  it('잔액 초과 시 에러 발생', async () => {
    const userId = 1;

    // 적은 양만 충전
    await service.charge(userId, 1000);

    // 과도한 사용 요청 → 에러 발생 기대
    await expect(service.use(userId, 9999)).rejects.toThrow(
      '잔액이 부족합니다.',
    );
  });

  it('사용자 포인트 충전/사용 내역 조회 가능', async () => {
    const userId = 1;

    await service.charge(userId, 1000);
    await service.use(userId, 1000);

    const histories = await service.getHistories(userId);

    expect(Array.isArray(histories)).toBe(true);
    expect(histories.length).toBeGreaterThan(0);
    expect(histories[0]).toHaveProperty('userId', userId);
    expect(histories[0]).toHaveProperty('type'); // CHARGE 또는 USE
  });
});
