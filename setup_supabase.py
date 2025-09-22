#!/usr/bin/env python3
"""
나주교회 캘린더 Supabase 설정 및 테스트 스크립트
"""

from supabase import create_client, Client
import json

# 환경 변수 설정
SUPABASE_URL = "https://xlucntjdccjtuwwmqjnc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdWNudGpkY2NqdHV3d21xam5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTQxOTgsImV4cCI6MjA3NDAzMDE5OH0.hP7Lh8Fz4hrClc5J6DCBQhdlNcgZbY7guYLjS8r_uo8"

def create_supabase_client():
    """Supabase 클라이언트 생성"""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def test_connection():
    """Supabase 연결 테스트"""
    print("🔗 Supabase 연결을 테스트합니다...")
    try:
        supabase = create_supabase_client()
        # 간단한 쿼리로 연결 테스트
        result = supabase.table('_supabase_temp_test').select('*').limit(1).execute()
        print("✅ Supabase 연결 성공!")
        return supabase
    except Exception as e:
        # 테이블이 없는 것은 정상이지만, 연결 자체는 성공한 경우
        if "does not exist" in str(e) or "relation" in str(e) or "table" in str(e):
            print("✅ Supabase 연결 성공! (테스트 테이블 없음)")
            return create_supabase_client()
        else:
            print(f"❌ Supabase 연결 실패: {str(e)}")
            return None

def check_existing_tables(supabase: Client):
    """기존 테이블 확인"""
    print("\n🔍 기존 테이블을 확인합니다...")

    # events 테이블 확인
    try:
        result = supabase.table('events').select('*').limit(1).execute()
        print("✅ events 테이블이 이미 존재합니다!")
        return True
    except Exception as e:
        if "does not exist" in str(e) or "relation" in str(e):
            print("❌ events 테이블이 존재하지 않습니다.")
            return False
        else:
            print(f"❌ 테이블 확인 중 오류: {str(e)}")
            return False

def insert_sample_data(supabase: Client):
    """샘플 데이터 삽입"""
    print("\n📝 샘플 데이터를 삽입합니다...")

    sample_events = [
        {
            "title": "주일예배",
            "date": "2025-01-26",
            "start_time": "11:00:00",
            "end_time": "12:30:00",
            "category": "church",
            "description": "주일 오전 예배",
            "location": "본당",
            "is_all_day": False
        },
        {
            "title": "장년회 모임",
            "date": "2025-01-27",
            "start_time": "19:00:00",
            "end_time": "21:00:00",
            "category": "adult",
            "description": "월례 장년회 모임",
            "location": "교육관",
            "is_all_day": False
        },
        {
            "title": "청년회 예배",
            "date": "2025-01-29",
            "start_time": "19:30:00",
            "end_time": "21:00:00",
            "category": "youth",
            "description": "청년부 수요예배",
            "location": "청년부실",
            "is_all_day": False
        },
        {
            "title": "부녀회 기도회",
            "date": "2025-01-30",
            "start_time": "10:00:00",
            "end_time": "11:30:00",
            "category": "women",
            "description": "목요 기도회",
            "location": "기도실",
            "is_all_day": False
        },
        {
            "title": "학생회 모임",
            "date": "2025-01-31",
            "start_time": "18:00:00",
            "end_time": "20:00:00",
            "category": "student",
            "description": "금요일 중고등부 모임",
            "location": "학생부실",
            "is_all_day": False
        },
        {
            "title": "유년회 성경학교",
            "date": "2025-02-01",
            "start_time": None,
            "end_time": None,
            "category": "children",
            "description": "어린이 성경학교",
            "location": "유아부실",
            "is_all_day": True
        }
    ]

    try:
        result = supabase.table('events').insert(sample_events).execute()
        print(f"✅ {len(sample_events)}개의 샘플 이벤트가 성공적으로 삽입되었습니다!")
        return True
    except Exception as e:
        print(f"❌ 샘플 데이터 삽입 실패: {str(e)}")
        return False

def verify_data(supabase: Client):
    """데이터 검증"""
    print("\n📊 데이터를 검증합니다...")

    try:
        # 전체 이벤트 조회
        result = supabase.table('events').select('*').execute()
        events = result.data

        print(f"✅ 총 {len(events)}개의 이벤트가 저장되어 있습니다.")

        if len(events) > 0:
            print("\n📋 저장된 이벤트 목록:")
            for event in events:
                print(f"   • {event['title']} ({event['date']}) - {event['category']}")

            # 카테고리별 통계
            categories = {}
            for event in events:
                category = event['category']
                categories[category] = categories.get(category, 0) + 1

            print("\n📈 카테고리별 이벤트 수:")
            for category, count in categories.items():
                print(f"   • {category}: {count}개")

        return True

    except Exception as e:
        print(f"❌ 데이터 검증 실패: {str(e)}")
        return False

def show_sql_instructions():
    """SQL 실행 방법 안내"""
    print("\n" + "=" * 80)
    print("📋 수동 SQL 실행 방법 (Supabase 대시보드)")
    print("=" * 80)
    print("1. https://supabase.com/dashboard 에 로그인")
    print("2. 'xlucntjdccjtuwwmqjnc' 프로젝트 선택")
    print("3. 왼쪽 메뉴에서 'SQL Editor' 클릭")
    print("4. 'New query' 버튼 클릭")
    print("5. 아래 SQL을 복사해서 붙여넣기:")
    print("\n" + "-" * 40)

    sql_script = """-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE church_category AS ENUM (
  'church',     -- 교회 일정 (파란색 계열)
  'adult',      -- 장년회 (진한 파란색)
  'youth',      -- 청년회 (초록색 계열)
  'advisory',   -- 자문회 (보라색 계열)
  'women',      -- 부녀회 (핑크색 계열)
  'student',    -- 학생회 (주황색 계열)
  'children'    -- 유년회 (노란색 계열)
);

CREATE TYPE recurring_type AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  category church_category NOT NULL DEFAULT 'church',
  description TEXT,
  location VARCHAR(255),
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  reminder INTEGER, -- minutes before event
  recurring recurring_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON events
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON events
    FOR DELETE USING (true);

-- Insert sample data
INSERT INTO events (title, date, start_time, end_time, category, description, location, is_all_day) VALUES
('주일예배', '2025-01-26', '11:00', '12:30', 'church', '주일 오전 예배', '본당', false),
('장년회 모임', '2025-01-27', '19:00', '21:00', 'adult', '월례 장년회 모임', '교육관', false),
('청년회 예배', '2025-01-29', '19:30', '21:00', 'youth', '청년부 수요예배', '청년부실', false),
('부녀회 기도회', '2025-01-30', '10:00', '11:30', 'women', '목요 기도회', '기도실', false),
('학생회 모임', '2025-01-31', '18:00', '20:00', 'student', '금요일 중고등부 모임', '학생부실', false),
('유년회 성경학교', '2025-02-01', null, null, 'children', '어린이 성경학교', '유아부실', true);"""

    print(sql_script)
    print("-" * 40)
    print("6. 'Run' 버튼 클릭하여 실행")
    print("7. 성공 메시지 확인")
    print("=" * 80)

def main():
    """메인 실행 함수"""
    print("🏛️ 나주교회 캘린더 Supabase 설정")
    print("=" * 60)

    # Supabase 연결 테스트
    supabase = test_connection()
    if not supabase:
        print("❌ Supabase 연결에 실패했습니다.")
        return

    # 기존 테이블 확인
    if check_existing_tables(supabase):
        print("ℹ️ events 테이블이 이미 존재합니다.")

        # 기존 데이터 확인
        if verify_data(supabase):
            print("✅ 데이터베이스가 이미 설정되어 있습니다!")
        else:
            # 데이터가 없는 경우 샘플 데이터 삽입
            print("📝 샘플 데이터를 삽입합니다...")
            if insert_sample_data(supabase):
                verify_data(supabase)
                print("\n🎉 샘플 데이터 삽입이 완료되었습니다!")
    else:
        print("⚠️ events 테이블이 존재하지 않습니다.")
        show_sql_instructions()

if __name__ == "__main__":
    main()