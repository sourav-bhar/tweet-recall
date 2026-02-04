import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 border-thick border-foreground flex items-center justify-center bg-primary">
        <span className="text-primary-foreground font-bold text-lg tracking-tighter">
          TR
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight leading-none">
          Tweet
        </span>
        <span className="text-lg font-bold tracking-tight leading-none text-primary">
          Recall
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/install", label: "Install" },
    { path: "/privacy", label: "Privacy" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background border-b-thick border-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive(link.path)
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="ml-2 w-10 h-10 border-thick border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" strokeWidth={2.5} />
              ) : (
                <Sun className="w-5 h-5" strokeWidth={2.5} />
              )}
            </button>
            <a
              href="https://github.com/sourav-bhar/tweet-recall"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide border-thick border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              GitHub
            </a>
          </nav>

          <button
            className="md:hidden w-12 h-12 border-thick border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={3} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={3} />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t-thick border-foreground">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-4 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    isActive(link.path)
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={toggleTheme}
                className="py-3 px-4 text-sm font-semibold uppercase tracking-wide hover:bg-muted transition-colors text-left flex items-center gap-2"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" strokeWidth={2.5} />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" strokeWidth={2.5} />
                    Light Mode
                  </>
                )}
              </button>
              <a
                href="https://github.com/sourav-bhar/tweet-recall"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 text-sm font-semibold uppercase tracking-wide hover:bg-muted transition-colors"
              >
                GitHub →
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
