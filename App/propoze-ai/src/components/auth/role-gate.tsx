"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface RoleGateProps {
  children: ReactNode;
  role?: string;
  permission?: string;
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean; // true: AND 조건, false: OR 조건 (기본값)
  fallback?: ReactNode;
}

export function RoleGate({
  children,
  role,
  permission,
  roles,
  permissions,
  requireAll = false,
  fallback = null,
}: RoleGateProps) {
  const {
    isAuthenticated,
    hasRole,
    hasPermission,
    hasAllRoles,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
  } = useAuth();

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  let authorized = true;

  // 단일 역할 체크
  if (role) {
    authorized = authorized && hasRole(role);
  }

  // 단일 권한 체크
  if (permission) {
    authorized = authorized && hasPermission(permission);
  }

  // 다중 역할 체크
  if (roles && roles.length > 0) {
    authorized =
      authorized && (requireAll ? hasAllRoles(roles) : hasAnyRole(roles));
  }

  // 다중 권한 체크
  if (permissions && permissions.length > 0) {
    authorized =
      authorized &&
      (requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions));
  }

  if (!authorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 편의를 위한 프리셋 컴포넌트들
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate role="admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function PremiumOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate role="premium" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function CanCreateProposal({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate permission="proposal:create" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function CanExportProposal({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate permission="proposal:export" fallback={fallback}>
      {children}
    </RoleGate>
  );
}
