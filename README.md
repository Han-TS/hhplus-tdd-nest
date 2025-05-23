# hhplus-tdd-nest

항해 플러스 Lite 백엔드 코스 1기

## 동시성 제어 방식 분석

### 작동 원리

- `userLocks`라는 `Map` 객체를 이용하여 **사용자별 Promise 체인**을 관리합니다.
- `withUserLock` 함수는 이전 작업(Promise)이 끝날 때까지 기다린 후 새로운 작업을 수행합니다.
- 예외가 발생해도 체인을 끊지 않기 위해 `.then(() => {}, () => {})`로 후속 체인을 유지합니다.
- 사용자 단위로 **순차적으로 작업이 수행**되며, 동시에 들어온 요청은 **큐처럼 처리**됩니다.

---

### 적용 대상 예시

다음과 같은 작업은 모두 데이터 정합성이 매우 중요하므로 동시성 제어가 반드시 필요합니다:

- 포인트 조회
- 포인트 충전
- 포인트 사용
- 포인트 히스토리 기록

---

### 장점과 단점

#### 장점

- 간단한 구조로 빠르게 구현 가능
- 사용자 단위로 병렬성 유지 가능 (다른 사용자끼리는 동시 처리 가능)
- 글로벌 락이 아닌 미세한 제어로 성능 손실 최소화

#### 단점

- Node.js 서버 인스턴스 간에는 락 공유 불가 (단일 인스턴스 전제)
- 서버 재시작 시 `userLocks` Map 초기화됨
- 메모리 기반이므로 서버 확장성에 제약 있음

---

### 테스트 시나리오 요약

통합 테스트에서는 다음과 같은 동시 요청을 시뮬레이션하였습니다:

- **동일한 사용자가 동시에 10건의 포인트 충전 요청**을 보냈을 때:
  - 충전 내역과 최종 포인트 잔액이 정확히 일치하는지 검증
- **동시에 포인트 사용 요청**을 보냈을 때:
  - 포인트 한도를 초과하지 않고, 중복 차감되지 않는지 확인

테스트 결과: **모든 요청이 순차적으로 안정 처리됨을 확인**

---

### 개선 방향

| 개선 항목      | 설명                                         |
| -------------- | -------------------------------------------- |
| 분산 환경 대응 | Redis 등의 외부 시스템을 이용한 분산 락 구현 |
| TTL 추가       | 락 체인에 타임아웃을 두어 무한 대기 방지     |
| Lock 모듈화    | 재사용성과 테스트 용이성을 위한 별도 유틸화  |

---

### 결론

현재 방식은 **단일 서버 기반**에서 포인트 충돌을 방지하기 위한 **간단하면서 효과적인 해결책**입니다.  
하지만 **수평 확장**을 고려할 경우, Redis 등 외부 시스템 기반의 **분산 락**으로 전환이 필요합니다.
