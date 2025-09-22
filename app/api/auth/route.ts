import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // 환경변수에서 비밀번호 가져오기 (서버 사이드에서만 접근 가능)
    const correctPassword = process.env.APP_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      );
    }

    // 비밀번호 검증
    if (password === correctPassword) {
      // 인증 성공 - 쿠키 설정
      const cookieStore = cookies();

      // 7일간 유효한 세션 쿠키 생성
      cookieStore.set('auth-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 인증 상태 확인
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('auth-session');

  if (sessionCookie?.value === 'authenticated') {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  // 로그아웃 - 쿠키 삭제
  const cookieStore = cookies();
  cookieStore.delete('auth-session');

  return NextResponse.json({ success: true });
}