import { Link } from "react-router-dom";
import { Github, ArrowUpRight } from "lucide-react";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 border-thick border-background flex items-center justify-center bg-primary">
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

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <BrandMark />
            <p className="text-background/60 text-sm mt-4 max-w-sm leading-relaxed">
              A privacy-first Chrome extension that captures tweets as you
              browse and lets you search them later. All data stays local in
              your browser.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-3">
            <h3 className="text-mono text-xs uppercase tracking-wide text-primary mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/install"
                  className="text-sm text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Install
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-4">
            <h3 className="text-mono text-xs uppercase tracking-wide text-primary mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/sourav-bhar/tweet-recall"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-background/70 hover:text-background transition-colors inline-flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub Repository
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sourav-bhar/tweet-recall/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-background/70 hover:text-background transition-colors inline-flex items-center gap-2"
                >
                  Report an Issue
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sourav-bhar/tweet-recall/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-background/70 hover:text-background transition-colors inline-flex items-center gap-2"
                >
                  Releases
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-background/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-mono text-xs text-background/50">
            &copy; {currentYear} Sourav Bhar. MIT License.
          </p>
          <p className="text-mono text-xs text-background/50">
            Built for privacy enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
