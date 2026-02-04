import { Link } from "react-router-dom";
import {
  Search,
  Shield,
  Zap,
  Download,
  Eye,
  Database,
  ArrowRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

function FeatureCard({
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
      className="group bg-card border-thick border-foreground p-6 hover-lift animate-slide-up opacity-0"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 border-thick border-foreground flex items-center justify-center bg-primary text-primary-foreground">
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <span className="text-mono text-sm text-muted-foreground">
          0{index + 1}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex gap-6 items-start animate-slide-in-right opacity-0"
      style={{
        animationDelay: `${number * 150}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex-shrink-0 w-16 h-16 border-thick border-foreground bg-foreground text-background flex items-center justify-center">
        <span className="text-mono text-2xl font-bold">{number}</span>
      </div>
      <div className="pt-2">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-mono text-4xl sm:text-5xl font-bold text-primary mb-1">
        {value}
      </div>
      <div className="text-sm uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "All data stored locally in your browser. No servers, no tracking, no data collection.",
    },
    {
      icon: Search,
      title: "Instant Search",
      description:
        "Full-text search with fuzzy matching. Find tweets by content, author, or keywords.",
    },
    {
      icon: Eye,
      title: "Smart Capture",
      description:
        "Only captures tweets you actually scroll past. No prefetched or hidden content.",
    },
    {
      icon: Database,
      title: "Export Anytime",
      description:
        "Your data is yours. Export everything as JSON whenever you want.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Built with performance in mind. Search thousands of tweets instantly.",
    },
    {
      icon: Download,
      title: "Open Source",
      description:
        "MIT licensed. Inspect the code, contribute, or fork it for yourself.",
    },
  ];

  const steps = [
    {
      title: "Install the Extension",
      description: "Download and add Tweet Recall to Chrome in under a minute.",
    },
    {
      title: "Browse Twitter/X",
      description:
        "The extension quietly captures tweets as you scroll through your feed.",
    },
    {
      title: "Search Anytime",
      description:
        "Click the extension icon and search through every tweet you've seen.",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 pattern-grid">
        <div className="max-w-5xl mx-auto">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-bold uppercase tracking-wide mb-8">
              <Shield className="w-4 h-4" strokeWidth={3} />
              100% Local • Zero Tracking
            </div>
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tighter mb-6 animate-slide-up opacity-0"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            Remember
            <br />
            <span className="text-primary">Every Tweet</span>
            <br />
            You've Seen
          </h1>

          <p
            className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-slide-up opacity-0"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            A Chrome extension that captures tweets as you browse and lets you
            search through them later. Your data never leaves your device.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 animate-slide-up opacity-0"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <Link
              to="/install"
              className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-5 font-bold text-lg uppercase tracking-wide border-thick border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Install Now
              <ArrowRight
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                strokeWidth={3}
              />
            </Link>
            <a
              href="https://github.com/sourav-bhar/tweet-recall"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-background text-foreground px-8 py-5 font-bold text-lg uppercase tracking-wide border-thick border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              View Source
              <ArrowUpRight
                className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={3}
              />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 px-4 sm:px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <Stat value="0" label="Network Requests" />
            <Stat value="100%" label="Local Storage" />
            <Stat value="∞" label="Tweets Stored" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="text-mono text-sm uppercase tracking-wide text-primary mb-4 block">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4">
              Built for Privacy
              <br />
              Enthusiasts
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg">
              Tweet Recall is designed from the ground up with privacy as the
              core principle. Your data never leaves your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 bg-cream pattern-diagonal">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <span className="text-mono text-sm uppercase tracking-wide text-primary mb-4 block">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter">
              Three Simple Steps
            </h2>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <StepCard key={step.title} number={index + 1} {...step} />
            ))}
          </div>

          <div className="mt-16">
            <Link
              to="/install"
              className="inline-flex items-center gap-2 text-foreground font-bold uppercase tracking-wide border-b-thick border-primary pb-1 hover:text-primary transition-colors"
            >
              View detailed installation guide
              <ArrowRight className="w-4 h-4" strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4">
                Ready to
                <br />
                <span className="text-primary">Remember?</span>
              </h2>
              <p className="text-background/70 max-w-md text-lg">
                Stop losing interesting tweets. Install Tweet Recall and build
                your personal, searchable archive.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/install"
                className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-6 font-bold text-xl uppercase tracking-wide border-thick border-background hover:bg-background hover:text-foreground transition-colors"
              >
                Get Started
                <ArrowRight
                  className="w-6 h-6 transition-transform group-hover:translate-x-1"
                  strokeWidth={3}
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
