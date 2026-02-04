import { Link } from "react-router-dom";
import {
  Search,
  Shield,
  Zap,
  Download,
  Eye,
  Database,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
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
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
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
      title: "Free & Open Source",
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
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            100% Privacy-First
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Remember Every Tweet
            <span className="text-primary"> You've Seen</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A Chrome extension that captures tweets as you browse and lets you
            search through them later. All data stays local in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/install"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Install Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/sourav-bhar/tweet-recall"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
            >
              View on GitHub
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No account required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No data sent anywhere
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Open source
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for Privacy Enthusiasts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tweet Recall is designed from the ground up with privacy as the
              core principle. Your data never leaves your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Get started in three simple steps.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <StepCard key={step.title} number={index + 1} {...step} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/install"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              View detailed installation guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Remember?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Stop losing interesting tweets. Install Tweet Recall and build your
            personal, searchable archive.
          </p>
          <Link
            to="/install"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
