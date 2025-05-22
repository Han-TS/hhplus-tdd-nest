import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';

describe('PointController (통합 테스트)', () => {
  let app: INestApplication;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userPointTable = moduleRef.get(UserPointTable);
    pointHistoryTable = moduleRef.get(PointHistoryTable);
  });

  beforeEach(async () => {
    // 실제 서버 인스턴스의 데이터를 초기화하기 위해 API 호출
    await request(app.getHttpServer()).patch('/point/1/reset');
    await request(app.getHttpServer()).patch('/point/1/histories/reset');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /point/:id - 유저 포인트 조회', async () => {
    const res = await request(app.getHttpServer()).get('/point/1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body.point).toBe(0); // 초기화된 상태
  });

  it('PATCH /point/:id/charge - 포인트 충전', async () => {
    const res = await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.point).toBe(10000);
  });

  it('PATCH /point/:id/use - 포인트 사용', async () => {
    // 충전 후 사용
    await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 10000 });

    const res = await request(app.getHttpServer())
      .patch('/point/1/use')
      .send({ amount: 3000 });

    expect(res.status).toBe(200);
    expect(res.body.point).toBe(17000); // 10000 - 3000
  });

  it('PATCH /point/:id/use - 잔액 부족 시 실패해야 한다', async () => {
    const res = await request(app.getHttpServer())
      .patch('/point/1/use')
      .send({ amount: 99999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('잔액이 부족합니다');
  });

  it('GET /point/:id/histories - 포인트 내역 조회', async () => {
    // 충전 후 사용
    await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 1000 });

    await request(app.getHttpServer())
      .patch('/point/1/use')
      .send({ amount: 300 });

    const res = await request(app.getHttpServer()).get('/point/1/histories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5); // 충전 + 사용
    expect(res.body[0]).toHaveProperty('userId', 1);
  });
});
