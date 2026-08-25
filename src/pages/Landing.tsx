import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Compass,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Zap,
  Target,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const features = [
  {
    icon: Compass,
    title: "Discover Colleges",
    description: "Browse verified colleges with eligibility matching, entrance exam info, and fee details.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship Navigator",
    description: "AI-powered scholarship matching based on your profile — find every opportunity you qualify for.",
  },
  {
    icon: FileText,
    title: "Track Applications",
    description: "Organize and track every application from start to finish. Never miss a status update.",
  },
  {
    icon: Calendar,
    title: "Smart Deadlines",
    description: "Never miss a deadline with intelligent reminders and priority-based tracking.",
  },
  {
    icon: Bell,
    title: "Real-time Alerts",
    description: "Get notified instantly when deadlines change, new scholarships appear, or status updates occur.",
  },
  {
    icon: TrendingUp,
    title: "AI Recommendations",
    description: "Personalized college and scholarship recommendations powered by eligibility analysis.",
  },
];

const steps = [
  { step: "1", title: "Create Your Profile", description: "Tell us about your background, academics, and goals." },
  { step: "2", title: "Get Matched", description: "Our AI analyzes your profile against thousands of opportunities." },
  { step: "3", title: "Apply & Track", description: "Apply to the best matches and track every application in one place." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight">CollegePath</span>
            <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">
              AI-Powered
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-9">
              {theme === "light" ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" onClick={handleCTA}>
              Get Started
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <motion.div initial="hidden" animate="show" variants={stagger}>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6">
                <Sparkles className="mr-1.5 size-3" />
                AI-Powered Admissions Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              Your Path to the{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Right College
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
            >
              Discover colleges and scholarships matched to your profile. Track applications,
              never miss deadlines, and get AI-powered recommendations — all in one place.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleCTA} className="h-12 px-8 text-sm">
                Start Your Journey
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth?returnTo=/scholarships")}
                className="h-12 px-8 text-sm"
              >
                Explore Scholarships
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Free to use
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                100+ verified scholarships
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                AI-powered matching
              </span>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-card/50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Everything you need to navigate admissions
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                A complete platform designed to simplify your college and scholarship journey.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((f) => (
                <motion.div key={f.title} variants={fadeUp}>
                  <Card className="h-full border-border/60 transition-all hover:border-primary/20 hover:shadow-sm">
                    <CardContent className="p-5">
                      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <f.icon className="size-5" />
                      </div>
                      <h3 className="text-sm font-semibold">{f.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {f.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <motion.div variants={fadeUp} className="text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                Three simple steps to find your perfect college and scholarship match.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <motion.div key={s.step} variants={fadeUp} className="text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust */}
        <section className="border-t bg-card/50 px-6 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                Verified Sources Only
              </span>
              <span className="flex items-center gap-2">
                <Target className="size-4 text-primary" />
                Deterministic Matching
              </span>
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                Real-time Updates
              </span>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <motion.div
            variants={fadeUp}
            className="mx-auto max-w-2xl rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/[0.02] p-10 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to find your path?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join students who are already using CollegePath to navigate their admissions journey.
            </p>
            <Button size="lg" onClick={handleCTA} className="mt-6 h-12 px-8">
              Get Started Free
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t px-6 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <span className="text-sm font-semibold">CollegePath</span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI Admissions Guide — Helping students find the right path.
            </p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
