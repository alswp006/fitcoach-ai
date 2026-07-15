# Changelog

## [0.1.0] - 2026-07-15

15/21 packets completed.

### Added
- feat: 전 엔티티/API/RouteState 타입 정의(types.ts) (packet 0001)
- feat: safeStorage: localStorage 안전 parse/쓰기(Quota) 유틸 (packet 0002)
- feat: Sessions/Reports CRUD + 페이지네이션 + orphan GC (packet 0004)
- feat: 번들 운동 정의 3종 상수 + 조회 유틸 (packet 0005)
- feat: AppStore(Context)로 프로필/프리미엄/AI고지/프로모션 상태 제공 (packet 0006)
- feat: 선택적 외부 AI API 클라이언트(fetch 래퍼) (packet 0007)
- feat: AI API 엔드포인트 함수(세션/피드백/리포트) + 로컬 폴백 인터페이스 (packet 0008)
- feat: 로컬 더미 생성 로직(플랜/피드백/리포트 템플릿) (packet 0009)
- feat: 세션 생성 유틸(세션ID/초기 SessionRecord 빌더) (packet 0010)
- feat: 공용 UI: ScreenScaffold + AppToastProvider + Empty/Error 섹션 (packet 0011)
- feat: S2 프로필('/profile') 페이지 구현(검증/저장/키보드) (packet 0013)
- feat: S3 운동 상세('/workouts/:workoutId') 페이지 구현(세션 시작/프리미엄 잠금) (packet 0014)
- feat: S6 AI 리포트('/report') 기본 구현(원격 옵션 + 로컬 폴백 + AI 라벨) (packet 0017)
- feat: S7 기록('/history') 기본 구현(20개 페이지네이션 + 더 보기) (packet 0018)
- feat: S8 프리미엄('/premium') 기본 구현(IAP 버튼 + 30일 부여) (packet 0019)
