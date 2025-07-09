import { createClient } from "@/lib/supabase/server";

export interface UserRole {
  id: string;
  name: string;
  description: string;
  workspace_id?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

/**
 * 사용자의 모든 역할을 가져옵니다
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `
      role_id,
      workspace_id,
      roles (
        id,
        name,
        description
      )
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.roles.id,
    name: item.roles.name,
    description: item.roles.description,
    workspace_id: item.workspace_id,
  }));
}

/**
 * 사용자의 모든 권한을 가져옵니다
 */
export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `
      roles (
        role_permissions (
          permissions (
            id,
            resource,
            action,
            description
          )
        )
      )
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];

  // Flatten permissions and remove duplicates
  const permissionsMap = new Map<string, Permission>();

  data.forEach((item: any) => {
    item.roles?.role_permissions?.forEach((rp: any) => {
      const perm = rp.permissions;
      if (perm) {
        const key = `${perm.resource}:${perm.action}`;
        permissionsMap.set(key, {
          id: perm.id,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        });
      }
    });
  });

  return Array.from(permissionsMap.values());
}

/**
 * 사용자가 특정 권한을 가지고 있는지 확인합니다
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string,
  workspaceId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Call the database function
  const { data, error } = await supabase.rpc("has_permission", {
    p_user_id: userId,
    p_resource: resource,
    p_action: action,
    p_workspace_id: workspaceId || null,
  });

  if (error) {
    console.error("Error checking permission:", error);
    return false;
  }

  return data === true;
}

/**
 * 사용자에게 역할을 할당합니다
 */
export async function assignRole(
  userId: string,
  roleName: string,
  workspaceId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get role ID
  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (roleError || !roleData) return false;

  // Assign role to user
  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role_id: roleData.id,
    workspace_id: workspaceId || null,
  });

  return !error;
}

/**
 * 사용자의 역할을 제거합니다
 */
export async function removeRole(
  userId: string,
  roleName: string,
  workspaceId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get role ID
  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (roleError || !roleData) return false;

  // Remove role from user
  const query = supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleData.id);

  if (workspaceId) {
    query.eq("workspace_id", workspaceId);
  } else {
    query.is("workspace_id", null);
  }

  const { error } = await query;

  return !error;
}
