#!/usr/bin/env python3
"""
나주교회 캘린더 데이터베이스 설정 스크립트
Supabase 데이터베이스에 필요한 테이블과 샘플 데이터를 생성합니다.
"""

import os
from supabase import create_client, Client

# 환경 변수 설정
SUPABASE_URL = "https://xlucntjdccjtuwwmqjnc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdWNudGpkY2NqdHV3d21xam5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTQxOTgsImV4cCI6MjA3NDAzMDE5OH0.hP7Lh8Fz4hrClc5J6DCBQhdlNcgZbY7guYLjS8r_uo8"

def create_supabase_client():
    """Supabase 클라이언트 생성"""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def execute_sql(supabase: Client, sql: str, description: str = ""):
    """SQL 실행 함수"""
    try:
        print(f"실행 중: {description}")
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print(f"✅ 성공: {description}")
        return True
    except Exception as e:
        print(f"❌ 실패: {description} - {str(e)}")
        return False

def setup_database():
    """데이터베이스 설정"""
    supabase = create_supabase_client()

    # SQL 스크립트들
    sql_scripts = [
        {
            "sql": "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",
            "description": "UUID 확장 활성화"
        },
        {
            "sql": """
CREATE TYPE church_category AS ENUM (
  'church',     -- 교회 일정 (파란색 계열)
  'adult',      -- 장년회 (진한 파란색)
  'youth',      -- 청년회 (초록색 계열)
  'advisory',   -- 자문회 (보라색 계열)
  'women',      -- 부녀회 (핑크색 계열)
  'student',    -- 학생회 (주황색 계열)
  'children'    -- 유년회 (노란색 계열)
);
            """,
            "description": "church_category ENUM 타입 생성"
        },
        {
            "sql": """
CREATE TYPE recurring_type AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);
            """,
            "description": "recurring_type ENUM 타입 생성"
        },
        {
            "sql": """
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
            """,
            "description": "events 테이블 생성"
        },
        {
            "sql": """
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_created_at ON events(created_at);
            """,
            "description": "인덱스 생성"
        },
        {
            "sql": """
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
            """,
            "description": "updated_at 트리거 함수 생성"
        },
        {
            "sql": """
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
            """,
            "description": "updated_at 트리거 생성"
        },
        {
            "sql": "ALTER TABLE events ENABLE ROW LEVEL SECURITY;",
            "description": "RLS(Row Level Security) 활성화"
        },
        {
            "sql": """
CREATE POLICY "Enable read access for all users" ON events
    FOR SELECT USING (true);
            """,
            "description": "읽기 권한 정책 생성"
        },
        {
            "sql": """
CREATE POLICY "Enable insert for all users" ON events
    FOR INSERT WITH CHECK (true);
            """,
            "description": "삽입 권한 정책 생성"
        },
        {
            "sql": """
CREATE POLICY "Enable update for all users" ON events
    FOR UPDATE USING (true);
            """,
            "description": "업데이트 권한 정책 생성"
        },
        {
            "sql": """
CREATE POLICY "Enable delete for all users" ON events
    FOR DELETE USING (true);
            """,
            "description": "삭제 권한 정책 생성"
        }
    ]

    print("🚀 나주교회 캘린더 데이터베이스 설정을 시작합니다...")
    print("=" * 60)

    success_count = 0
    for script in sql_scripts:
        if execute_sql(supabase, script["sql"], script["description"]):
            success_count += 1

    print("=" * 60)
    print(f"📊 결과: {success_count}/{len(sql_scripts)} 성공")

    if success_count == len(sql_scripts):
        print("✅ 모든 테이블과 설정이 성공적으로 생성되었습니다!")
        return insert_sample_data(supabase)
    else:
        print("❌ 일부 설정에서 오류가 발생했습니다.")
        return False

def insert_sample_data(supabase: Client):
    """샘플 데이터 삽입"""
    print("\n📝 샘플 데이터를 삽입합니다...")

    sample_events = [
        {
            "title": "주일예배",
            "date": "2025-01-26",
            "start_time": "11:00",
            "end_time": "12:30",
            "category": "church",
            "description": "주일 오전 예배",
            "location": "본당",
            "is_all_day": False
        },
        {
            "title": "장년회 모임",
            "date": "2025-01-27",
            "start_time": "19:00",
            "end_time": "21:00",
            "category": "adult",
            "description": "월례 장년회 모임",
            "location": "교육관",
            "is_all_day": False
        },
        {
            "title": "청년회 예배",
            "date": "2025-01-29",
            "start_time": "19:30",
            "end_time": "21:00",
            "category": "youth",
            "description": "청년부 수요예배",
            "location": "청년부실",
            "is_all_day": False
        },
        {
            "title": "부녀회 기도회",
            "date": "2025-01-30",
            "start_time": "10:00",
            "end_time": "11:30",
            "category": "women",
            "description": "목요 기도회",
            "location": "기도실",
            "is_all_day": False
        },
        {
            "title": "학생회 모임",
            "date": "2025-01-31",
            "start_time": "18:00",
            "end_time": "20:00",
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

def verify_setup(supabase: Client):
    """설정 검증"""
    print("\n🔍 데이터베이스 설정을 검증합니다...")

    try:
        # 테이블 존재 확인
        result = supabase.table('events').select('*').limit(1).execute()

        # 전체 이벤트 수 확인
        count_result = supabase.table('events').select('*', count='exact').execute()
        event_count = len(count_result.data)

        print(f"✅ events 테이블이 정상적으로 생성되었습니다!")
        print(f"📊 현재 {event_count}개의 이벤트가 저장되어 있습니다.")

        # 카테고리별 이벤트 수 확인
        categories = ['church', 'adult', 'youth', 'women', 'student', 'children']
        for category in categories:
            cat_result = supabase.table('events').select('*').eq('category', category).execute()
            print(f"   - {category}: {len(cat_result.data)}개")

        return True

    except Exception as e:
        print(f"❌ 검증 실패: {str(e)}")
        return False

def main():
    """메인 실행 함수"""
    print("🏛️ 나주교회 캘린더 데이터베이스 설정")
    print("=" * 60)

    try:
        supabase = create_supabase_client()
        print("✅ Supabase 연결 성공")

        # 데이터베이스 설정
        if setup_database():
            # 설정 검증
            verify_setup(supabase)
            print("\n🎉 나주교회 캘린더 데이터베이스 설정이 완료되었습니다!")
        else:
            print("\n❌ 데이터베이스 설정 중 오류가 발생했습니다.")

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    main()