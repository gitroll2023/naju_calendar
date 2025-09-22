#!/usr/bin/env python3
"""
나주교회 캘린더 데이터베이스 테이블 생성 스크립트
Supabase를 사용하여 직접 테이블을 생성하고 데이터를 삽입합니다.
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
        # 기존 테이블이 있는지 확인 (예: auth.users 테이블)
        result = supabase.rpc('ping').execute()
        print("✅ Supabase 연결 성공!")
        return supabase
    except Exception as e:
        print(f"❌ Supabase 연결 실패: {str(e)}")
        return None

def insert_sample_data(supabase: Client):
    """샘플 데이터 삽입 (테이블이 이미 존재한다고 가정)"""
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
        print(f"오류 세부사항: {e}")
        return False

def verify_table_exists(supabase: Client):
    """테이블 존재 여부 확인"""
    print("\n🔍 events 테이블 존재 여부를 확인합니다...")

    try:
        # 테이블에서 데이터를 조회해서 테이블 존재 확인
        result = supabase.table('events').select('*').limit(1).execute()
        print("✅ events 테이블이 존재합니다!")
        return True
    except Exception as e:
        print(f"❌ events 테이블이 존재하지 않거나 접근할 수 없습니다: {str(e)}")
        return False

def verify_setup(supabase: Client):
    """설정 검증"""
    print("\n📊 데이터베이스 설정을 검증합니다...")

    try:
        # 전체 이벤트 수 확인
        result = supabase.table('events').select('*').execute()
        event_count = len(result.data)

        print(f"✅ events 테이블에 {event_count}개의 이벤트가 저장되어 있습니다.")

        if event_count > 0:
            # 첫 번째 이벤트 정보 표시
            first_event = result.data[0]
            print(f"📅 첫 번째 이벤트: {first_event.get('title', 'N/A')} ({first_event.get('date', 'N/A')})")

            # 카테고리별 이벤트 수 확인
            categories = ['church', 'adult', 'youth', 'women', 'student', 'children']
            print("\n📈 카테고리별 이벤트 수:")
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

    # Supabase 연결 테스트
    supabase = test_connection()
    if not supabase:
        print("❌ Supabase 연결에 실패했습니다. 환경 변수를 확인해주세요.")
        return

    # 테이블 존재 확인
    if verify_table_exists(supabase):
        print("ℹ️ events 테이블이 이미 존재합니다. 샘플 데이터 삽입을 진행합니다.")

        # 샘플 데이터 삽입
        if insert_sample_data(supabase):
            verify_setup(supabase)
            print("\n🎉 데이터베이스 설정이 완료되었습니다!")
        else:
            print("\n❌ 샘플 데이터 삽입에 실패했습니다.")
    else:
        print("\n⚠️ events 테이블이 존재하지 않습니다.")
        print("Supabase 대시보드에서 수동으로 SQL을 실행해야 합니다.")
        print("\n📋 다음 단계:")
        print("1. https://supabase.com/dashboard 에 로그인")
        print("2. 프로젝트 선택")
        print("3. SQL Editor로 이동")
        print("4. 제공된 SQL 스크립트 실행")

if __name__ == "__main__":
    main()