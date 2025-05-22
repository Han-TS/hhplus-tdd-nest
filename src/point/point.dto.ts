import { IsInt, Min } from 'class-validator';

// 포인트 요청 DTO (충전, 사용 공통)
export class PointDto {
  @IsInt() // 정수여야 함
  @Min(1) // 최소 1 이상
  amount: number;
}
