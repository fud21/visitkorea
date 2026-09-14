import {
  Compass,
  Home,
  Map,
  MapPinned,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const menu = [
  {
    to: "/",
    icon: Home,
    label: "홈",
  },
  {
    to: "/map",
    icon: Map,
    label: "지도 탐색",
  },
  {
    to: "/region/gyeongju",
    icon: MapPinned,
    label: "지역 랭킹",
  },
  {
    to: "/course/setup/gyeongju",
    icon: Sparkles,
    label: "테마 코스",
  },
  {
    to: "/course/result",
    icon: Route,
    label: "여행 기록",
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      <div className="brand">
        <Compass size={22} />
        <span>LOCAL:ON</span>
      </div>

      <nav className="sidebar-nav">
        {menu.map(({ to, icon: Icon, label }) => (
          <NavLink key={label} to={to} className="nav-item">
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to={user ? "/mypage" : "/login"} className="sidebar-footer">
        <UserRound size={18} />
        <span>{user ? "마이페이지" : "로그인"}</span>
      </NavLink>
    </aside>
  );
}
