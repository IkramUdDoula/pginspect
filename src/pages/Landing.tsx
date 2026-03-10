import { Database, Zap, Shield, Cloud, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { theme } = useTheme();

  // If already signed in, redirect to app
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/app", { replace: true });
    }
  }, [isSignedIn, isLoaded, navigate]);

  return (
    <div className="min-h-screen bg-background grid-texture">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">pgInspect</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/sign-in")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
          <Zap className="h-3.5 w-3.5" />
          <span>Modern PostgreSQL Management</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Inspect, Query, and Manage
          <br />
          <span className="text-primary">PostgreSQL Databases</span>
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-lg font-medium mb-10">
          <span>No payment, No bullshit, just Postgres!</span>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button size="lg" onClick={() => window.open("https://github.com/ikramuddoula/pginspect", "_blank")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
            Self Host Your Panel
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Screenshot/Preview */}
        <div className="mt-16 rounded-xl border border-border bg-card p-2 shadow-2xl max-w-fit mx-auto">
          <div className="rounded-lg overflow-hidden bg-muted">
            <img 
              src={`/image-${theme}.png`}
              alt={`pgInspect Dashboard Preview - ${theme === 'light' ? 'Light' : 'Dark'} Theme`}
              className="w-auto h-auto max-w-full transition-opacity duration-200"
              key={`theme-${theme}`}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
          <p className="text-muted-foreground">Powerful features for modern database management</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Query Builder</h3>
            <p className="text-sm text-muted-foreground">
              Build complex queries with an intuitive drag-and-drop interface. No SQL knowledge required.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Schema Inspector</h3>
            <p className="text-sm text-muted-foreground">
              Explore tables, columns, indexes, and relationships with detailed metadata and statistics.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Connections</h3>
            <p className="text-sm text-muted-foreground">
              Encrypted password storage with AES-256-GCM. Your credentials are always protected.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cloud Ready</h3>
            <p className="text-sm text-muted-foreground">
              Connect to any PostgreSQL database - local, cloud, or self-hosted. Supports SSL/TLS.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Connection</h3>
            <p className="text-sm text-muted-foreground">
              Manage multiple database connections. Switch between them seamlessly.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Results</h3>
            <p className="text-sm text-muted-foreground">
              Execute queries and see results instantly. Export data in multiple formats.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Sign up now and start managing your PostgreSQL databases with ease. 
            No credit card required.
          </p>
          <Button size="lg" onClick={() => window.open("https://github.com/ikramuddoula/pginspect", "_blank")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
            Self Host Your Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-semibold">pgInspect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 pgInspect. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
