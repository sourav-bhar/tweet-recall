import { Link } from "react-router-dom";
import {
  Download,
  FolderOpen,
  Settings,
  ToggleRight,
  Pin,
  CheckCircle,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface InstallStepProps {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tip?: string;
}

function InstallStep({
  number,
  icon: Icon,
  title,
  description,
  tip,
}: InstallStepProps) {
  return (
    <div className="flex gap-6 p-6 bg-card rounded-xl border border-border">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-3">{description}</p>
        {tip && (
          <div className="flex items-start gap-2 text-sm bg-primary/5 text-primary p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Install() {
  const steps: InstallStepProps[] = [
    {
      number: 1,
      icon: Download,
      title: "Download the Extension",
      description:
        "Go to the GitHub releases page and download the latest version. Click the 'Source code (zip)' link to download the ZIP file.",
      tip: "Make sure to download from the official GitHub repository to ensure you're getting the authentic extension.",
    },
    {
      number: 2,
      icon: FolderOpen,
      title: "Extract the ZIP File",
      description:
        "Unzip the downloaded file to a location on your computer. Remember where you extract it - you'll need this folder in the next steps.",
    },
    {
      number: 3,
      icon: Settings,
      title: "Open Chrome Extensions Page",
      description:
        "Open Google Chrome and navigate to chrome://extensions in your address bar. You can also click the puzzle piece icon in the toolbar and select 'Manage Extensions'.",
    },
    {
      number: 4,
      icon: ToggleRight,
      title: "Enable Developer Mode",
      description:
        "Look for the 'Developer mode' toggle in the top-right corner of the Extensions page and turn it ON. This allows you to install extensions from local folders.",
    },
    {
      number: 5,
      icon: FolderOpen,
      title: "Load the Extension",
      description:
        "Click the 'Load unpacked' button that appears after enabling Developer mode. Navigate to the extracted folder and select the 'dist' folder inside it.",
      tip: "Select the 'dist' folder, not the root folder. The dist folder contains the built extension files.",
    },
    {
      number: 6,
      icon: Pin,
      title: "Pin the Extension",
      description:
        "Click the puzzle piece icon in Chrome's toolbar, find 'Tweet Recall' in the list, and click the pin icon to keep it visible in your toolbar for easy access.",
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Installation Guide
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Follow these simple steps to install Tweet Recall on your Chrome
            browser. The process takes less than a minute.
          </p>
        </div>

        {/* Download Button */}
        <div className="mb-12 p-6 bg-primary/5 rounded-xl border border-primary/20 text-center">
          <h2 className="font-semibold mb-3">Step 0: Get the Files</h2>
          <a
            href="https://github.com/sourav-bhar/tweet-recall/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download from GitHub
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Or clone the repository and run{" "}
            <code className="bg-secondary px-2 py-1 rounded">pnpm build</code>
          </p>
        </div>

        {/* Installation Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step) => (
            <InstallStep key={step.number} {...step} />
          ))}
        </div>

        {/* Success Section */}
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl mb-12">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">You're All Set!</h3>
              <p className="text-muted-foreground mb-4">
                Tweet Recall is now installed and ready to use. Browse Twitter/X
                normally and the extension will automatically capture tweets as
                you scroll. Click the extension icon anytime to search through
                your captured tweets.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Auto-captures while browsing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Search with instant results
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Export data anytime
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-lg mb-4">Troubleshooting</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">
                Extension not capturing tweets?
              </h4>
              <p className="text-muted-foreground">
                Make sure you're on twitter.com or x.com. Try refreshing the
                page after installation. Check Chrome DevTools console for any
                errors.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">
                Search not returning results?
              </h4>
              <p className="text-muted-foreground">
                Results only appear after you've browsed some tweets. The
                extension captures tweets as you scroll - it doesn't import
                historical data.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Need more help?</h4>
              <p className="text-muted-foreground">
                Check the{" "}
                <a
                  href="https://github.com/sourav-bhar/tweet-recall/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Issues
                </a>{" "}
                page or open a new issue describing your problem.
              </p>
            </div>
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
