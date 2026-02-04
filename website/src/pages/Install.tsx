import { Link } from "react-router-dom";
import {
  Download,
  FolderOpen,
  Settings,
  ToggleRight,
  Pin,
  Check,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface InstallStepProps {
  number: number;
  icon: LucideIcon;
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
    <div
      className="flex flex-col sm:flex-row gap-6 p-6 bg-card border-thick border-foreground animate-slide-up opacity-0"
      style={{
        animationDelay: `${number * 100}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="shrink-0 flex sm:flex-col items-center gap-4 sm:gap-2">
        <div className="w-14 h-14 border-thick border-foreground bg-foreground text-background flex items-center justify-center">
          <span className="text-mono text-xl font-bold">{number}</span>
        </div>
        <div className="hidden sm:block w-[3px] flex-1 bg-border min-h-[40px]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 border-thick border-foreground bg-primary text-primary-foreground flex items-center justify-center">
            <Icon className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4">{description}</p>
        {tip && (
          <div className="flex items-start gap-3 text-sm bg-foreground text-background p-4">
            <AlertCircle
              className="w-5 h-5 shrink-0 mt-0.5"
              strokeWidth={2.5}
            />
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center">
        <Check className="w-4 h-4" strokeWidth={3} />
      </div>
      <span className="text-sm">{children}</span>
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
        "Unzip the downloaded file to a location on your computer. Remember where you extract it — you'll need this folder in the next steps.",
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
        <div className="mb-12 animate-fade-in">
          <span className="text-mono text-sm uppercase tracking-wide text-primary mb-4 block">
            Guide
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4">
            Installation
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Follow these steps to install Tweet Recall on Chrome. The process
            takes less than a minute.
          </p>
        </div>

        {/* Download Button */}
        <div className="mb-12 p-6 bg-foreground text-background border-thick border-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-mono text-sm uppercase tracking-wide text-primary mb-1 block">
                Step 0
              </span>
              <h2 className="font-bold text-xl">Get the Files</h2>
            </div>
            <a
              href="https://github.com/sourav-bhar/tweet-recall/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 py-4 font-bold uppercase tracking-wide border-thick border-background hover:bg-background hover:text-foreground transition-colors"
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              Download
              <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>
          <p className="mt-4 text-sm text-background/70">
            Or clone the repository and run{" "}
            <code className="bg-background/20 px-2 py-1 text-mono">
              pnpm build
            </code>
          </p>
        </div>

        {/* Installation Steps */}
        <div className="space-y-0 mb-12">
          {steps.map((step) => (
            <InstallStep key={step.number} {...step} />
          ))}
        </div>

        {/* Success Section */}
        <div className="p-6 bg-primary text-primary-foreground border-thick border-foreground mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-background text-foreground flex items-center justify-center shrink-0">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">You're All Set!</h3>
              <p className="mb-4 text-primary-foreground/80">
                Tweet Recall is now installed and ready to use. Browse Twitter/X
                normally and the extension will automatically capture tweets as
                you scroll.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <CheckItem>Auto-captures while browsing</CheckItem>
                <CheckItem>Search with instant results</CheckItem>
                <CheckItem>Export data anytime</CheckItem>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="p-6 bg-card border-thick border-foreground">
          <h3 className="font-bold text-xl mb-6">Troubleshooting</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs text-mono">
                  ?
                </span>
                Extension not capturing tweets?
              </h4>
              <p className="text-muted-foreground text-sm pl-8">
                Make sure you're on twitter.com or x.com. Try refreshing the
                page after installation. Check Chrome DevTools console for any
                errors.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs text-mono">
                  ?
                </span>
                Search not returning results?
              </h4>
              <p className="text-muted-foreground text-sm pl-8">
                Results only appear after you've browsed some tweets. The
                extension captures tweets as you scroll — it doesn't import
                historical data.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs text-mono">
                  ?
                </span>
                Need more help?
              </h4>
              <p className="text-muted-foreground text-sm pl-8">
                Check the{" "}
                <a
                  href="https://github.com/sourav-bhar/tweet-recall/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold border-b-2 border-primary hover:text-foreground hover:border-foreground transition-colors"
                >
                  GitHub Issues
                </a>{" "}
                page or open a new issue describing your problem.
              </p>
            </div>
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
