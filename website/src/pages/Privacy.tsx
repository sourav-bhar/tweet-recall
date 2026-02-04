import { Link } from "react-router-dom";
import {
  Shield,
  Database,
  Lock,
  Trash2,
  Download,
  Eye,
  Server,
  Check,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

function PrivacyPoint({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <div
      className="flex gap-4 p-5 bg-card border-thick border-foreground animate-slide-up opacity-0"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="shrink-0">
        <div className="w-12 h-12 border-thick border-foreground bg-primary text-primary-foreground flex items-center justify-center">
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function CheckListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
        <Check className="w-3 h-3" strokeWidth={4} />
      </div>
      <span>{children}</span>
    </li>
  );
}

export default function Privacy() {
  const keyPoints = [
    {
      icon: Database,
      title: "Local Storage Only",
      description:
        "All captured tweets are stored in your browser's IndexedDB. Data never leaves your device.",
    },
    {
      icon: Server,
      title: "No External Servers",
      description:
        "Tweet Recall makes zero network requests. There are no servers, APIs, or cloud services involved.",
    },
    {
      icon: Eye,
      title: "No Tracking or Analytics",
      description:
        "We don't track your browsing, usage patterns, or any other behavior. No telemetry whatsoever.",
    },
    {
      icon: Lock,
      title: "No Account Required",
      description:
        "Use Tweet Recall without creating an account, signing in, or providing any personal information.",
    },
    {
      icon: Download,
      title: "Full Data Export",
      description:
        "Export all your captured tweets as JSON anytime. Your data belongs to you.",
    },
    {
      icon: Trash2,
      title: "Easy Data Deletion",
      description:
        "Delete all captured data with one click. Uninstalling the extension also removes all data.",
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold uppercase tracking-wide mb-6">
            <Shield className="w-4 h-4" strokeWidth={3} />
            Privacy-First
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Tweet Recall is designed with privacy as the core principle. Here's
            exactly how your data is handled.
          </p>
        </div>

        {/* TLDR Section */}
        <div className="mb-12 p-6 bg-foreground text-background border-thick border-foreground">
          <h2 className="font-bold text-xl mb-4 flex items-center gap-3">
            <span className="text-mono text-primary">TL;DR</span>
          </h2>
          <ul className="space-y-3 text-background/80">
            <CheckListItem>All data stays on your device</CheckListItem>
            <CheckListItem>No network requests are made</CheckListItem>
            <CheckListItem>No tracking, analytics, or telemetry</CheckListItem>
            <CheckListItem>
              You can export or delete your data anytime
            </CheckListItem>
            <CheckListItem>
              Open source — verify the code yourself
            </CheckListItem>
          </ul>
        </div>

        {/* Key Points */}
        <div className="mb-12">
          <span className="text-mono text-sm uppercase tracking-wide text-primary mb-4 block">
            Key Points
          </span>
          <h2 className="text-2xl font-bold mb-6">Privacy Guarantees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keyPoints.map((point, index) => (
              <PrivacyPoint key={point.title} {...point} index={index} />
            ))}
          </div>
        </div>

        {/* Detailed Policy */}
        <div className="space-y-8">
          <div>
            <span className="text-mono text-sm uppercase tracking-wide text-primary mb-4 block">
              Details
            </span>
            <h2 className="text-2xl font-bold mb-6">Full Privacy Policy</h2>
          </div>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                01
              </span>
              What Data Is Collected
            </h3>
            <p className="text-muted-foreground mb-4">
              Tweet Recall captures publicly visible tweet data from your
              Twitter/X browsing session, including:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Tweet text content
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Author username and display name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Tweet timestamp
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Tweet URL
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Media indicators
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                Quote tweet content
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" />
                When you saw the tweet
              </li>
            </ul>
          </section>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                02
              </span>
              How Data Is Stored
            </h3>
            <p className="text-muted-foreground mb-4">
              All captured data is stored locally in your browser using
              IndexedDB, a built-in browser storage mechanism. The data is:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary mt-2" />
                Only accessible to the Tweet Recall extension
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary mt-2" />
                Stored entirely on your local device
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary mt-2" />
                Never transmitted to any server or third party
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary mt-2" />
                Deleted when you clear browser data or uninstall the extension
              </li>
            </ul>
          </section>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                03
              </span>
              Permissions Used
            </h3>
            <p className="text-muted-foreground mb-4">
              Tweet Recall requires minimal Chrome permissions:
            </p>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-background border-thick border-foreground">
                <code className="text-mono font-bold">storage</code>
                <p className="text-muted-foreground mt-1">
                  To store captured tweets in IndexedDB
                </p>
              </div>
              <div className="p-4 bg-background border-thick border-foreground">
                <code className="text-mono font-bold">activeTab</code>
                <p className="text-muted-foreground mt-1">
                  To access the current tab's content when on Twitter/X
                </p>
              </div>
              <div className="p-4 bg-background border-thick border-foreground">
                <code className="text-mono font-bold">host_permissions</code>
                <p className="text-muted-foreground mt-1">
                  x.com and twitter.com only — to run the content script
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No other permissions are requested. The extension cannot access
              other websites, your browsing history, or any other sensitive
              data.
            </p>
          </section>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                04
              </span>
              Your Rights
            </h3>
            <p className="text-muted-foreground mb-4">
              You have complete control over your data:
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="font-bold w-20 shrink-0">Export</span>
                <span className="text-muted-foreground">
                  Download all your data as a JSON file at any time through the
                  extension settings
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold w-20 shrink-0">Delete</span>
                <span className="text-muted-foreground">
                  Clear all captured data with one click through the extension
                  settings
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold w-20 shrink-0">Inspect</span>
                <span className="text-muted-foreground">
                  View raw data in Chrome DevTools (Application → IndexedDB →
                  tweet-recall)
                </span>
              </div>
            </div>
          </section>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                05
              </span>
              Open Source
            </h3>
            <p className="text-muted-foreground">
              Tweet Recall is open source under the MIT license. You can{" "}
              <a
                href="https://github.com/sourav-bhar/tweet-recall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold border-b-2 border-primary hover:text-foreground hover:border-foreground transition-colors"
              >
                view the source code on GitHub
              </a>{" "}
              to verify these privacy claims for yourself.
            </p>
          </section>

          <section className="p-6 bg-card border-thick border-foreground">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-mono text-sm">
                06
              </span>
              Contact
            </h3>
            <p className="text-muted-foreground">
              If you have questions about this privacy policy or Tweet Recall's
              data practices, please{" "}
              <a
                href="https://github.com/sourav-bhar/tweet-recall/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold border-b-2 border-primary hover:text-foreground hover:border-foreground transition-colors"
              >
                open an issue on GitHub
              </a>
              .
            </p>
          </section>

          <div className="pt-6 border-t-thick border-foreground">
            <p className="text-mono text-sm text-muted-foreground">
              Last updated: February 2026
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-bold uppercase tracking-wide border-b-thick border-primary pb-1 hover:text-primary transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={3} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
