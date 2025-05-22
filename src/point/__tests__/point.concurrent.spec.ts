import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

/**
 * 실제 동시성 처리가 순차적으로 잘 처리되는지 테스트
 */
describe('PointService 동시성 테스트', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('동시에 여러 요청이 들어와도 순차적으로 처리되어야 한다', async () => {
    // 우선 유저에게 1000 포인트를 충전
    await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 900 });

    // 동시에 3건의 500포인트 사용 요청을 생성
    const useRequest = () =>
      request(app.getHttpServer()).patch('/point/1/use').send({ amount: 500 });

    // Promise.allSettled로 동시에 요청을 보내고 각 응답을 구분
    const results = await Promise.allSettled([
      useRequest(),
      useRequest(),
      useRequest(),
    ]);

    const fulfilled = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 200,
    );
    const rejected = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 400,
    );

    console.log('fulfilled:', fulfilled.length);
    console.log('rejected:', rejected.length);

    // 기대 결과: 하나의 요청만 성공하고, 나머지는 잔액 부족으로 실패해야 함
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);
  });
});
