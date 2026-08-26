import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, GraduationCap, Sun, Moon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

function ResetPasswordInner() {
  const { authView, updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If authView is not "reset-password", the useAuth hook hasn't detected
  // the recovery token yet — show a loading state
  if (authView !== "reset-password" && authView !== "password-updated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (authView === "password-updated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground">
            Your password has been successfully changed. You can now sign in with your new password.
          </p>
          <Button className="w-full" onClick={() => navigate("/auth")}>
            Sign in <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero */}
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
            Your path to college, <span className="text-primary">one smart move</span> at a time.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            CollegePath brings eligibility, deadlines, scholarships and applications into one calm, personal workspace.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 CollegePath</div>
      </div>

      {/* Right Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="absolute right-6 top-6">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold">Set new password</h2>
          <p className="mt-2 text-muted-foreground">
            Enter your new password below. Make sure it's at least 6 characters.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <>
                  Update password <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
              disabled={isLoading}
            >
              Back to sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
