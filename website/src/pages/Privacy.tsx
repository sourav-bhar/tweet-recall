import { Link } from "react-router-dom";
import {
  Shield,
  Database,
  Lock,
  Trash2,
  Download,
  Eye,
  Server,
  CheckCircle,
} from "lucide-react";

function PrivacyPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-green-500" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Privacy-First Design
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tweet Recall is designed with privacy as the core principle. Here's
            exactly how your data is handled.
          </p>
        </div>

        {/* TLDR Section */}
        <div className="mb-12 p-6 bg-green-500/5 border border-green-500/20 rounded-xl">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            TL;DR
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>All data stays on your device</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>No network requests are made</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>No tracking, analytics, or telemetry</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>You can export or delete your data anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Open source - verify the code yourself</span>
            </li>
          </ul>
        </div>

        {/* Key Points */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Key Privacy Points</h2>
          <div className="space-y-4">
            {keyPoints.map((point) => (
              <PrivacyPoint key={point.title} {...point} />
            ))}
          </div>
        </div>

        {/* Detailed Policy */}
        <div className="prose prose-sm max-w-none">
          <h2 className="text-xl font-semibold mb-4">
            Detailed Privacy Policy
          </h2>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h3 className="text-foreground font-medium mb-2">
                What Data Is Collected
              </h3>
              <p>
                Tweet Recall captures publicly visible tweet data from your
                Twitter/X browsing session, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tweet text content</li>
                <li>Author username and display name</li>
                <li>Tweet timestamp</li>
                <li>Tweet URL</li>
                <li>Media indicators (whether the tweet has images/video)</li>
                <li>Quote tweet content (if applicable)</li>
                <li>When you saw the tweet (timestamp)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-foreground font-medium mb-2">
                How Data Is Stored
              </h3>
              <p>
                All captured data is stored locally in your browser using
                IndexedDB, a built-in browser storage mechanism. The data is:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Only accessible to the Tweet Recall extension</li>
                <li>Stored entirely on your local device</li>
                <li>Never transmitted to any server or third party</li>
                <li>
                  Deleted when you clear browser data or uninstall the extension
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-foreground font-medium mb-2">
                Permissions Used
              </h3>
              <p>Tweet Recall requires minimal Chrome permissions:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>storage</strong> - To store captured tweets in
                  IndexedDB
                </li>
                <li>
                  <strong>activeTab</strong> - To access the current tab's
                  content when you're on Twitter/X
                </li>
                <li>
                  <strong>host permissions (x.com, twitter.com)</strong> - To
                  run the content script that captures tweets
                </li>
              </ul>
              <p className="mt-2">
                No other permissions are requested. The extension cannot access
                other websites, your browsing history, or any other sensitive
                data.
              </p>
            </section>

            <section>
              <h3 className="text-foreground font-medium mb-2">Your Rights</h3>
              <p>You have complete control over your data:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>Export</strong> - Download all your data as a JSON
                  file at any time through the extension settings
                </li>
                <li>
                  <strong>Delete</strong> - Clear all captured data with one
                  click through the extension settings
                </li>
                <li>
                  <strong>Inspect</strong> - View raw data in Chrome DevTools
                  (Application → IndexedDB → tweet-recall)
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-foreground font-medium mb-2">Open Source</h3>
              <p>
                Tweet Recall is open source under the MIT license. You can{" "}
                <a
                  href="https://github.com/sourav-bhar/tweet-recall"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  view the source code on GitHub
                </a>{" "}
                to verify these privacy claims for yourself.
              </p>
            </section>

            <section>
              <h3 className="text-foreground font-medium mb-2">Contact</h3>
              <p>
                If you have questions about this privacy policy or Tweet
                Recall's data practices, please{" "}
                <a
                  href="https://github.com/sourav-bhar/tweet-recall/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  open an issue on GitHub
                </a>
                .
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <p className="text-sm">Last updated: February 2026</p>
            </section>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link to="/" className="text-primary hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
