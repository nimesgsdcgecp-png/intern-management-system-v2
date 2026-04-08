

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Shield,
  Target,
  Users,
  Building
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCTA = () => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (session?.user) {
      const role = (session.user as { role?: string })?.role;
      router.push(`/dashboard/${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-app text-content-primary font-sans">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-surface-card/95 border-b border-border-default py-4 shadow-subtle" : "bg-transparent py-8"
        }`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
              <Building className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-content-primary tracking-tight">
              Intern <span className="text-primary-text">Management</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-content-secondary">
            <a href="#features" className="hover:text-primary-text transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary-text transition-colors">Solutions</a>
            <a href="#contact" className="hover:text-primary-text transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              onClick={handleCTA}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {status === "authenticated" ? "Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-subtle text-primary-text rounded-lg text-sm font-medium">
                Internship Management Platform
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-content-primary leading-tight">
                Streamline Your <br />
                <span className="text-primary-text">Internship Program</span>
              </h1>

              <p className="text-lg text-content-secondary leading-relaxed max-w-xl">
                A comprehensive platform to manage interns, track progress, and facilitate mentorship in real-time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleCTA}
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Start Free Trial
                </Button>
                <button className="btn btn-secondary btn-lg">
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="card p-8">
                <div className="bg-surface-muted rounded-2xl border border-border-subtle overflow-hidden">
                  <div className="h-10 bg-surface-nav border-b border-border-subtle flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <div className="w-3 h-3 rounded-full bg-success" />
                  </div>
                  <div className="p-8 aspect-video flex flex-col gap-6">
                    <div className="flex gap-4">
                      <div className="w-1/3 h-20 bg-surface-muted rounded-lg border border-border-subtle" />
                      <div className="w-1/3 h-20 bg-surface-muted rounded-lg border border-border-subtle" />
                      <div className="w-1/3 h-20 bg-surface-muted rounded-lg border border-border-subtle" />
                    </div>
                    <div className="flex-1 bg-surface-muted rounded-lg border border-border-subtle flex items-center justify-center text-content-muted font-medium text-sm">
                      Dashboard Preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 border-t border-border-subtle">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-primary-text font-semibold text-sm mb-4 uppercase tracking-wide">Platform Features</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-content-primary mb-6">Built for Every Role</h2>
              <p className="text-lg text-content-secondary">Empowering administrators, mentors, and interns with specialized tools for success.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  role: "Administrators",
                  title: "Complete Control",
                  desc: "Manage users, departments, and system settings with comprehensive admin tools.",
                  icon: <Shield className="w-6 h-6 text-primary-text" />
                },
                {
                  role: "Mentors",
                  title: "Guide & Monitor",
                  desc: "Track intern progress, review reports, and provide valuable feedback and guidance.",
                  icon: <Target className="w-6 h-6 text-primary-text" />
                },
                {
                  role: "Interns",
                  title: "Learn & Grow",
                  desc: "Submit daily reports, manage tasks, and track your professional development journey.",
                  icon: <Users className="w-6 h-6 text-primary-text" />
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="card card-interactive p-8"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary-subtle rounded-lg flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <p className="text-sm font-semibold text-primary-text uppercase tracking-wide mb-2">{feature.role}</p>
                  <h3 className="text-xl font-bold text-content-primary mb-4">{feature.title}</h3>
                  <p className="text-content-secondary leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-surface-nav">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-content-nav mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-content-nav-muted mb-10 max-w-2xl mx-auto">
              Join organizations using our platform to build the workforce of tomorrow. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCTA}
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Start Free Trial
              </Button>
              <Link href="/auth/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
                <Building className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-content-primary">
                Intern Management System
              </span>
            </div>
            <p className="text-content-muted text-sm">
              © {new Date().getFullYear()} Intern Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
