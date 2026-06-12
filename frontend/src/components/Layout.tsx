import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Predict", end: true },
  { to: "/best", label: "Best Today", end: false },
  { to: "/history", label: "History", end: false },
  { to: "/favorites", label: "Favorites", end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-oracle-accent to-oracle-accent2 text-lg shadow-glow">
              ⚽
            </span>
            <span className="text-base font-extrabold tracking-tight text-white">
              Football <span className="text-oracle-accent">Oracle</span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.end ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== "/";
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="relative rounded-full px-3 py-1.5 font-medium text-slate-300 transition hover:text-white sm:px-4"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-slate-500 sm:px-6">
        Football Oracle · predictions are statistical models, not guarantees. Bet responsibly.
      </footer>
    </div>
  );
}
