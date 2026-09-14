import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page"><div className="status-banner">로그인 정보를 확인하는 중입니다.</div></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
