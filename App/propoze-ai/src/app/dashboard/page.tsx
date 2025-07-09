"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  RoleGate,
  AdminOnly,
  CanCreateProposal,
  CanExportProposal,
} from "@/components/auth/role-gate";
import Link from "next/link";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">대시보드</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">사용자 정보</h2>
          <div className="space-y-2">
            <p>
              <strong>이름:</strong> {user?.name || "미설정"}
            </p>
            <p>
              <strong>이메일:</strong> {user?.email}
            </p>
            <p>
              <strong>역할:</strong> {user?.roles?.join(", ") || "없음"}
            </p>
            <p>
              <strong>권한 수:</strong> {user?.permissions?.length || 0}개
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 모든 사용자가 볼 수 있는 카드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">프로젝트</h3>
            <p className="text-gray-600 mb-4">
              진행 중인 프로젝트를 관리하세요.
            </p>
            <Link
              href="/projects"
              className="text-indigo-600 hover:text-indigo-500"
            >
              프로젝트 보기 →
            </Link>
          </div>

          {/* 제안서 생성 권한이 있는 사용자만 */}
          <CanCreateProposal
            fallback={
              <div className="bg-gray-100 rounded-lg p-6 opacity-50">
                <h3 className="text-xl font-semibold mb-3">제안서 생성</h3>
                <p className="text-gray-600">제안서 생성 권한이 없습니다.</p>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-3">제안서 생성</h3>
              <p className="text-gray-600 mb-4">
                AI를 활용하여 새 제안서를 만들어보세요.
              </p>
              <Link
                href="/proposals/new"
                className="text-indigo-600 hover:text-indigo-500"
              >
                새 제안서 만들기 →
              </Link>
            </div>
          </CanCreateProposal>

          {/* 제안서 내보내기 권한이 있는 사용자만 */}
          <CanExportProposal
            fallback={
              <div className="bg-gray-100 rounded-lg p-6 opacity-50">
                <h3 className="text-xl font-semibold mb-3">제안서 내보내기</h3>
                <p className="text-gray-600">
                  제안서 내보내기 권한이 없습니다.
                </p>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-3">제안서 내보내기</h3>
              <p className="text-gray-600 mb-4">제안서를 PDF로 내보내세요.</p>
              <Link
                href="/proposals/export"
                className="text-indigo-600 hover:text-indigo-500"
              >
                내보내기 설정 →
              </Link>
            </div>
          </CanExportProposal>

          {/* 관리자만 볼 수 있는 카드 */}
          <AdminOnly
            fallback={
              <div className="bg-gray-100 rounded-lg p-6 opacity-50">
                <h3 className="text-xl font-semibold mb-3">관리자 설정</h3>
                <p className="text-gray-600">관리자 권한이 필요합니다.</p>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-3">관리자 설정</h3>
              <p className="text-gray-600 mb-4">
                사용자 및 시스템을 관리하세요.
              </p>
              <Link
                href="/admin"
                className="text-indigo-600 hover:text-indigo-500"
              >
                관리 페이지로 →
              </Link>
            </div>
          </AdminOnly>
        </div>

        {/* 권한별 기능 표시 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">사용 가능한 기능</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <RoleGate permission="proposal:create">
              <span className="text-green-600">✓ 제안서 생성</span>
            </RoleGate>
            <RoleGate permission="proposal:read">
              <span className="text-green-600">✓ 제안서 조회</span>
            </RoleGate>
            <RoleGate permission="proposal:update">
              <span className="text-green-600">✓ 제안서 수정</span>
            </RoleGate>
            <RoleGate permission="proposal:delete">
              <span className="text-green-600">✓ 제안서 삭제</span>
            </RoleGate>
            <RoleGate permission="proposal:export">
              <span className="text-green-600">✓ 제안서 내보내기</span>
            </RoleGate>
            <RoleGate permission="ai_analysis:create">
              <span className="text-green-600">✓ AI 분석 요청</span>
            </RoleGate>
            <RoleGate permission="workspace:manage">
              <span className="text-green-600">✓ 워크스페이스 관리</span>
            </RoleGate>
            <RoleGate permission="user:manage">
              <span className="text-green-600">✓ 사용자 관리</span>
            </RoleGate>
            <RoleGate permission="billing:manage">
              <span className="text-green-600">✓ 결제 관리</span>
            </RoleGate>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
