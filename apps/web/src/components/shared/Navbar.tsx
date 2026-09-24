import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, LayoutDashboard, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, accessToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center shadow-glow-primary">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              DB <span className="gradient-text">Best Worlds</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {accessToken ? (
              <>
                <Link
                  to="/plan"
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Plan a Trip
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted hover:text-slate-200 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Trips
                </Link>
                {(user?.role === "SUPPORT" || user?.role === "ADMIN") && (
                  <Link
                    to="/ops"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-warning hover:text-white transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Ops
                  </Link>
                )}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                  <span className="text-sm text-muted">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn-secondary text-sm px-4 py-2">
                  Sign In
                </Link>
                <Link to="/auth?tab=register" className="btn-primary text-sm px-4 py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-muted hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="md:hidden border-t border-border bg-surface/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-2"
        >
          {accessToken ? (
            <>
              <Link to="/plan" className="btn-primary text-sm" onClick={() => setMenuOpen(false)}>
                Plan a Trip
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" /> My Trips
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-danger"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-secondary text-sm" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/auth?tab=register" className="btn-primary text-sm" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </motion.div>
      )}
    </nav>
  );
}
