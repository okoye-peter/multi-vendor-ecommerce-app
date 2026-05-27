import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/Index.ts";
import { useGetAuthenticatedUserQuery } from "../store/features/AuthApi.ts";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { isLoading } = useGetAuthenticatedUserQuery(undefined, { skip: !!user });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
