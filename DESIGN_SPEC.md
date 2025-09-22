# 📱 모바일 캘린더 앱 디자인 사양서

## 🎯 프로젝트 개요
Google Calendar와 유사한 모바일 퍼스트 캘린더 애플리케이션
- **주요 대상**: 모바일 사용자
- **핵심 기능**: 월간/주간 일정 보기, 일정 관리
- **디자인 원칙**: 심플, 직관적, 반응형

## 🏗️ 시스템 아키텍처

### 기술 스택
```
Frontend:
├── Next.js 14.2.x (App Router)
├── TypeScript
├── Tailwind CSS
├── date-fns (날짜 처리)
└── Zustand (상태 관리)

Features:
├── 한국 시간대 (Asia/Seoul)
├── 모바일 우선 반응형
├── PWA 지원
└── 오프라인 지원
```

### 컴포넌트 구조
```
app/
├── layout.tsx              # 루트 레이아웃
├── page.tsx               # 메인 캘린더 페이지
├── globals.css            # 전역 스타일
│
components/
├── calendar/
│   ├── CalendarContainer.tsx   # 캘린더 컨테이너
│   ├── CalendarHeader.tsx      # 년/월 네비게이션
│   ├── CalendarGrid.tsx        # 날짜 그리드
│   ├── CalendarDay.tsx         # 개별 날짜 셀
│   └── CalendarWeekDays.tsx    # 요일 헤더
│
├── events/
│   ├── EventList.tsx           # 일정 목록
│   ├── EventItem.tsx           # 개별 일정
│   ├── EventModal.tsx          # 일정 추가/수정 모달
│   └── EventIndicator.tsx      # 날짜별 일정 표시기
│
├── ui/
│   ├── BottomSheet.tsx         # 하단 시트 모달
│   ├── FloatingActionButton.tsx # FAB
│   └── SwipeableView.tsx       # 스와이프 가능 뷰
│
└── layout/
    ├── MobileHeader.tsx         # 모바일 헤더
    └── TabBar.tsx              # 하단 탭 바
```

## 🎨 UI/UX 디자인

### 색상 팔레트
```css
/* Primary Colors */
--primary-50: #EFF6FF;   /* 가장 밝은 */
--primary-100: #DBEAFE;
--primary-200: #BFDBFE;
--primary-300: #93C5FD;
--primary-400: #60A5FA;
--primary-500: #3B82F6;  /* 메인 */
--primary-600: #2563EB;
--primary-700: #1D4ED8;

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Status Colors */
--today-bg: #3B82F6;      /* 오늘 날짜 */
--selected-bg: #EFF6FF;   /* 선택된 날짜 */
--weekend: #EF4444;       /* 주말 */
--saturday: #3B82F6;      /* 토요일 */

/* Event Indicator Colors */
--event-red: #EF4444;
--event-yellow: #F59E0B;
--event-green: #10B981;
--event-blue: #3B82F6;
--event-purple: #8B5CF6;
```

### 타이포그래피
```css
/* Font System */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 레이아웃 시스템

#### 모바일 뷰 (320px - 768px)
```tsx
/* Mobile Layout */
<div className="h-screen flex flex-col">
  {/* Header: 56px */}
  <header className="h-14 fixed top-0 w-full z-50 bg-white border-b">
    {/* 년/월 표시, 오늘 버튼 */}
  </header>

  {/* Main Content: flex-1 */}
  <main className="flex-1 pt-14 pb-16 overflow-auto">
    {/* Calendar Grid */}
  </main>

  {/* Bottom Navigation: 64px */}
  <nav className="h-16 fixed bottom-0 w-full bg-white border-t">
    {/* 월간/주간/일간 탭 */}
  </nav>
</div>
```

#### 태블릿/데스크탑 뷰 (768px+)
```tsx
/* Tablet/Desktop Layout */
<div className="h-screen flex">
  {/* Sidebar: 280px */}
  <aside className="w-72 border-r hidden md:block">
    {/* Mini Calendar, Event List */}
  </aside>

  {/* Main Content */}
  <main className="flex-1 flex flex-col">
    {/* Calendar View */}
  </main>
</div>
```

## 📊 데이터 모델

### Event Interface
```typescript
interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple';
  description?: string;
  location?: string;
  isAllDay: boolean;
  reminder?: number; // minutes before
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}
```

### Calendar State
```typescript
interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  viewMode: 'month' | 'week' | 'day';
  events: Event[];
  loading: boolean;

  // Actions
  setCurrentDate: (date: Date) => void;
  selectDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
}
```

## 🎯 핵심 기능 명세

### 1. 날짜 선택 & 네비게이션
- **오늘 날짜**: 자동으로 active 상태 (파란 배경)
- **날짜 선택**: 탭하면 selected 상태 (연한 파란 배경)
- **월 이동**: 좌우 스와이프 또는 화살표 버튼
- **오늘로 이동**: 헤더의 "오늘" 버튼

### 2. 일정 표시
- **이벤트 인디케이터**: 날짜 셀 하단에 색상 점으로 표시
- **다중 일정**: 최대 3개의 점 표시, 그 이상은 "+n" 표시
- **일정 미리보기**: 날짜 탭 시 하단 시트에 일정 목록

### 3. 일정 관리
- **추가**: FAB 또는 날짜 롱프레스
- **수정**: 일정 탭
- **삭제**: 스와이프 또는 편집 모드에서 삭제
- **반복 일정**: 매일/매주/매월/매년 설정

### 4. 반응형 인터랙션
```typescript
/* Touch Gestures */
- Swipe Left/Right: 월 이동
- Long Press: 일정 추가
- Pull to Refresh: 데이터 새로고침
- Pinch: 뷰 모드 변경 (월간 ↔ 주간)

/* Animations */
- Page Transition: 300ms ease-in-out
- Modal: Bottom sheet slide-up
- Loading: Skeleton screens
- Feedback: Haptic feedback on actions
```

## 📱 모바일 최적화

### Performance
- 가상 스크롤링 (큰 일정 목록)
- 이미지 lazy loading
- Code splitting by route
- Service Worker 캐싱

### Accessibility
- ARIA labels
- 키보드 네비게이션
- 고대비 모드 지원
- 폰트 크기 조절 가능

### PWA Features
```json
{
  "name": "Calendar Naju",
  "short_name": "Calendar",
  "theme_color": "#3B82F6",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

## 🚀 구현 우선순위

### Phase 1 (MVP)
1. 기본 캘린더 그리드
2. 오늘 날짜 하이라이트
3. 날짜 선택 기능
4. 월 네비게이션
5. 기본 일정 표시 (점)

### Phase 2
1. 일정 추가/수정/삭제
2. 하단 시트 모달
3. 주간 뷰
4. 일정 색상 구분

### Phase 3
1. 반복 일정
2. 알림 기능
3. 검색 기능
4. 오프라인 지원
5. 데이터 동기화