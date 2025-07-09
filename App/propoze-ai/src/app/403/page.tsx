"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-indigo-600">403</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          접근 권한이 없습니다
        </h2>
        <p className="mt-2 text-gray-600">
          이 페이지에 접근하려면 필요한 권한이 있어야 합니다.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            이전 페이지로
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
