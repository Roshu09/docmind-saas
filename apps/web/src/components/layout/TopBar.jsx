import { Sun, Moon, Bell } from "lucide-react";
import { useThemeStore } from "../../store/themeStore.js";
import { useAuthStore } from "../../store/authStore.js";

export default function TopBar({ title }) {
  const { theme, toggleTheme } = useThemeStore();
  const { user, org } = useAuthStore();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      <h1 className="text-base font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: "var(--border)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
            {user?.full_name?.[0] || user?.email?.[0] || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-none">{user?.full_name || "User"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{org?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
