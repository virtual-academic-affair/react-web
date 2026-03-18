/**
 * RoleRoute
 * Restricts child routes to specific roles.
 * If the user's role is not allowed, redirects to the appropriate dashboard.
 */

import { useAuthStore } from "@/stores/auth.store";
import type { Role } from "@/types/users";
import { getRolePath } from "@/utils/auth.util";
import { Navigate, Outlet } from "react-router-dom";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const userRole = useAuthStore((s) => s.userRole);

  // Role matches
  if (userRole && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // Wrong role
  return <Navigate to={getRolePath(userRole)} replace />;
}
