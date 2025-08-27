import Link from "next/link";
import { ArrowRight, Boxes, Upload, Zap, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { LandingHeader } from "../components/landing-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Developer-first storage
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Bring your own S3 or R2 bucket. Get a better API, better DX, and
                better performance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Boxes className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Your Storage
              </h3>
              <p className="text-muted-foreground">
                Connect your existing S3 or Cloudflare R2 bucket. Keep full
                control and ownership of your data.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Better APIs
              </h3>
              <p className="text-muted-foreground">
                Modern REST and GraphQL APIs with TypeScript SDKs. Built for
                developers who want things to just work.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Secure by Default
              </h3>
              <p className="text-muted-foreground">
                Built-in authentication, rate limiting, and security best
                practices. Focus on building, not securing.
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-card-foreground">
                Quick Start
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    1. Connect Your Storage
                  </h3>
                  <p className="text-muted-foreground">
                    Connect your S3 or R2 bucket with your existing credentials.
                  </p>
                  <Button
                    asChild
                    variant="link"
                    className="p-0 h-auto text-orange-500"
                  >
                    <Link href="/dashboard">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    2. Start Building
                  </h3>
                  <p className="text-muted-foreground">
                    Use our SDK or REST API to upload files with better
                    performance and DX.
                  </p>
                  <Button
                    asChild
                    variant="link"
                    className="p-0 h-auto text-orange-500"
                  >
                    <Link href="/dashboard">
                      View Dashboard <Upload className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
