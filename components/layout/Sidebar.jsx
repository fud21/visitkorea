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

const menu = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/", icon: Map, label: "지도 탐색" },
  { to: "/region/%EA%B2%BD%EC%83%81%EB%B6%81%EB%8F%84", icon: MapPinned, label: "지역 분석" },
  { to: "/course/setup/%EA%B2%BD%EC%A3%BC%EC%8B%9C", icon: Sparkles, label: "테마 코스" },
  { to: "/course/result", icon: Route, label: "여행 기록" },
];

export default function Sidebar() {
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

      <div className="sidebar-footer">
        <UserRound size={18} />
        <span>로그인</span>
      </div>
    </aside>
  );
}
