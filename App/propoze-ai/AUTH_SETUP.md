# 인증 시스템 설정 가이드

## 개요

이 프로젝트는 NextAuth.js와 Supabase를 통합하여 다음과 같은 인증 기능을 제공합니다:

- 이메일/비밀번호 인증
- Google OAuth
- GitHub OAuth
- Kakao OAuth
- RBAC (역할 기반 접근 제어)

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Kakao OAuth (https://developers.kakao.com/)
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

### NEXTAUTH_SECRET 생성하기

```bash
openssl rand -base64 32
```

## 데이터베이스 마이그레이션

1. Supabase 대시보드에서 SQL Editor를 열어주세요.
2. `supabase/migrations/20250111_create_rbac_tables.sql` 파일의 내용을 실행하세요.

## OAuth 프로바이더 설정

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI 추가: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth

1. [GitHub Settings > Developer settings](https://github.com/settings/developers)에 접속
2. "New OAuth App" 클릭
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 설정 > 플랫폼 > Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:3000` (개발) / `https://yourdomain.com` (프로덕션)
4. 제품 설정 > 카카오 로그인 > 활성화 설정
5. Redirect URI 등록:
   - `http://localhost:3000/api/auth/callback/kakao` (개발)
   - `https://yourdomain.com/api/auth/callback/kakao` (프로덕션)
6. 동의항목 설정:
   - 닉네임 (필수)
   - 카카오계정(이메일) (필수)
7. 앱 키 > REST API 키를 `KAKAO_CLIENT_ID`로 사용
8. 보안 > Client Secret 생성 후 `KAKAO_CLIENT_SECRET`으로 사용

## 사용 방법

### 회원가입

```javascript
// API 엔드포인트를 통한 회원가입
const response = await fetch("/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
    name: "홍길동",
  }),
});
```

### 로그인

```javascript
import { signIn } from "next-auth/react";

// 이메일/비밀번호 로그인
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: false,
});

// 소셜 로그인
await signIn("google"); // Google
await signIn("github"); // GitHub
await signIn("kakao"); // Kakao
```

### 권한 확인

```javascript
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, hasRole, hasPermission } = useAuth();

  // 역할 확인
  if (hasRole("admin")) {
    // 관리자 기능
  }

  // 권한 확인
  if (hasPermission("proposal:create")) {
    // 제안서 생성 가능
  }
}
```

### 보호된 페이지

```javascript
// 인증 필요
const { user } = useAuth({ required: true });

// 특정 역할 필요
const { user } = useAuth({
  required: true,
  role: "admin",
});

// 특정 권한 필요
const { user } = useAuth({
  required: true,
  permission: "proposal:create",
});
```

## RBAC 시스템

### 기본 역할

- **admin**: 모든 권한
- **user**: 기본 사용자 권한 (제안서 생성/조회/수정, AI 분석)
- **premium**: 프리미엄 사용자 권한 (추가로 제안서 내보내기)

### 권한 목록

- `proposal:create` - 제안서 생성
- `proposal:read` - 제안서 조회
- `proposal:update` - 제안서 수정
- `proposal:delete` - 제안서 삭제
- `proposal:export` - 제안서 내보내기
- `ai_analysis:create` - AI 분석 요청
- `ai_analysis:read` - AI 분석 결과 조회
- `workspace:manage` - 워크스페이스 관리
- `user:manage` - 사용자 관리
- `billing:manage` - 결제 관리

## 트러블슈팅

### "NEXTAUTH_URL is not set" 에러

`.env.local` 파일에 `NEXTAUTH_URL`이 올바르게 설정되어 있는지 확인하세요.

### OAuth 로그인이 작동하지 않음

1. OAuth 프로바이더에서 리디렉션 URI가 올바르게 설정되어 있는지 확인
2. 클라이언트 ID와 시크릿이 올바른지 확인

### 데이터베이스 연결 실패

Supabase 프로젝트 URL과 키가 올바른지 확인하세요.
