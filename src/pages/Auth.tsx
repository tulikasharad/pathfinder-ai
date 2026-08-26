import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  GraduationCap,
  Shield,
  Sun,
  Moon,
  Mail,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard"
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

// ── Hero shared across all auth views ─────────────────────────────────────────

function AuthHero() {
  return (
    <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-accent/30 to-background p-10 lg:flex">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CollegePath</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            AI Admissions Guide
          </p>
        </div>
      </div>
      <div className="max-w-lg">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">
          A clearer way forward
        </p>
        <h2 className="text-4xl font-bold leading-tight tracking-tight">
          Your path to college,{" "}
          <span className="text-primary">one smart move</span> at a time.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          CollegePath brings eligibility, deadlines, scholarships and
          applications into one calm, personal workspace.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["AS", "PM", "RK", "SK", "DG"].map((initials, i) => (
              <div
                key={i}
                className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-bold text-primary"
              >
                {initials}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium">Join 2,400+ students</p>
            <p className="text-xs text-muted-foreground">
              already planning their journey
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            "Eligibility tracking",
            "Deadline alerts",
            "Scholarship matching",
            "AI recommendations",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/60 bg-accent/30 px-4 py-1.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">© 2026 CollegePath</div>
    </div>
  );
}

// ── Main Auth Component ───────────────────────────────────────────────────────

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const {
    isLoading: authLoading,
    isAuthenticated,
    authView,
    setAuthView,
    signUp,
    signIn,
    sendPasswordResetEmail,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth
  );

  // Sign in / Sign up form state
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect after successful auth
  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // ── Sign Up ──────────────────────────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signUp({ email, password, name });
      // authView is set to "email-confirmation" inside useAuth
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create account."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign In ──────────────────────────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signIn({ email, password });
      // onAuthStateChange handles navigation
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────────────────────

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSuccess("Check your email for the password reset link.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset to sign in with clean state ─────────────────────────────────────

  const goToSignIn = () => {
    setAuthTab("signin");
    setAuthView("signin");
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setName("");
  };

  const goToSignUp = () => {
    setAuthTab("signup");
    setAuthView("signup");
    setError(null);
    setSuccess(null);
  };

  // ── Email Confirmation View ───────────────────────────────────────────────

  if (authView === "email-confirmation") {
    return (
      <div className="min-h-screen flex">
        <AuthHero />
        <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
          <div className="absolute right-6 top-6">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          </div>
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to verify your account and sign in.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={goToSignIn}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to sign in
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password View ──────────────────────────────────────────────────

  if (authView === "forgot-password") {
    return (
      <div className="min-h-screen flex">
        <AuthHero />
        <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
          <div className="absolute right-6 top-6">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          </div>
          <div className="w-full max-w-md">
            <div className="flex size-12 mx-auto mb-4 items-center justify-center rounded-full bg-primary/10">
              <Lock className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              Reset your password
            </h1>
            <p className="mt-2 text-center text-muted-foreground">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>

            {success ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <CheckCircle2 className="mx-auto size-5 text-emerald-500" />
                  <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                    {success}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={goToSignIn}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email address</label>
                  <Input
                    name="email"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <>
                      Send reset link <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={goToSignIn}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to sign in
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Sign In / Sign Up Form ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex">
      <AuthHero />

      {/* Right Auth Section */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="absolute right-6 top-6">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2"
          >
            {theme === "dark" ? (
              <Sun className="size-3.5" />
            ) : (
              <Moon className="size-3.5" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>

        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl border border-border/60 bg-accent/30 p-1">
            <button
              onClick={goToSignIn}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                authTab === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={goToSignUp}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                authTab === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          {/* Sign In Form */}
          {authTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  name="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setAuthView("forgot-password");
                      setError(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <>
                    Sign in <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground">
                <Shield className="size-3" />
                Your information stays private and secure
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {authTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full name</label>
                <Input
                  name="name"
                  placeholder="Arjun Sharma"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  name="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !name || !email || !password}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <>
                    Create account <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground">
                <Shield className="size-3" />
                Your information stays private and secure
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
