import { NavLink, useNavigate } from "react-router-dom";
import { Files, Search, MessageSquare, LayoutDashboard, LogOut, Brain } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { logout } from "../../api/auth.js";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/documents", icon: Files, label: "Documents" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
];

export default function Sidebar() {
  const { org, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout().catch(() => {});
    clearAuth();
    navigate("/login");
  };

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}>
            <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>AiFi</p>
            <p className="text-xs truncate max-w-32" style={{ color: "var(--text-muted)" }}>{org?.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all " +
              (isActive
                ? "font-medium"
                : "hover:opacity-80")
            }
            style={({ isActive }) => isActive
              ? { background: "var(--accent-dim)", color: "var(--accent)" }
              : { color: "var(--text-secondary)" }
            }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}>
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
