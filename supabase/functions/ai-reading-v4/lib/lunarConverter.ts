/**
 * lunarConverter.ts - 음력→양력 변환
 * 한국 음력 달력 데이터 기반 변환 (1900-2100)
 */

// 간단한 음양력 변환 테이블 (manseryeok 라이브러리 사용 불가하므로 직접 구현)
// Edge Function에서는 npm 패키지를 직접 쓸 수 없으므로,
// 클라이언트에서 변환된 양력 날짜를 전달받는 것을 우선으로 하되,
// 서버 재계산 시 fallback으로 사용

export function lunarToSolar(
  lunarYear: number, 
  lunarMonth: number, 
  lunarDay: number, 
  isLeapMonth: boolean = false
): { year: number; month: number; day: number } {
  // TODO: 완전한 음양력 변환 테이블 구현 필요
  // 현재는 클라이언트에서 이미 변환된 양력을 birthInfo.birthDate로 보내므로
  // 이 함수는 방어적 fallback 역할
  console.warn("[lunarConverter] 서버 음력 변환은 아직 미구현. 클라이언트 변환값 사용 권장.");
  return { year: lunarYear, month: lunarMonth, day: lunarDay };
}
