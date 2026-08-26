import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { ArrowRight, Loader2, GraduationCap, Shield, Sun, Moon, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      await signIn("email-otp", email);
      setStep({ email });
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send verification code.");
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Section */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-accent/30 to-background p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="size-5" /></div>
          <div><h1 className="text-lg font-bold">CollegePath</h1><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI Admissions Guide</p></div>
        </div>
        <div className="max-w-lg">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">A clearer way forward</p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Your path to college, <span className="text-primary">one smart move</span> at a time.</h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">CollegePath brings eligibility, deadlines, scholarships and applications into one calm, personal workspace.</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">{["AS","PM","RK","SK","DG"].map((initials, i) => <div key={i} className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-bold text-primary">{initials}</div>)}</div>
            <div><p className="text-sm font-medium">Join 2,400+ students</p><p className="text-xs text-muted-foreground">already planning their journey</p></div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Eligibility tracking","Deadline alerts","Scholarship matching","AI recommendations"].map((tag) => <span key={tag} className="rounded-full border border-border/60 bg-accent/30 px-4 py-1.5 text-xs text-muted-foreground">{tag}</span>)}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 CollegePath</div>
      </div>

      {/* Right Auth Section */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="absolute right-6 top-6">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
        <div className="w-full max-w-md">
          {step === "signIn" ? (
            <>
              <div className="mb-6 flex rounded-xl border border-border/60 bg-accent/30 p-1">
                <button onClick={() => setAuthTab("signin")} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${authTab === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Sign in</button>
                <button onClick={() => setAuthTab("signup")} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${authTab === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Create account</button>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Email address</label><Input name="email" placeholder="you@example.com" type="email" disabled={isLoading} required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Password</label><Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} /></div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 rounded border-input" />Remember me</label>
                  <button type="button" className="text-sm text-primary hover:underline">Forgot password?</button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 size-4" /></>}</Button>
                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div></div>
                <Button type="button" variant="outline" className="w-full" onClick={handleGuestLogin} disabled={isLoading}><UserX className="mr-2 size-4" />Use demo account</Button>
                <div className="flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground"><Shield className="size-3" />Your information stays private and secure</div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 rounded-xl border border-border/60 bg-accent/30 p-1"><div className="rounded-lg bg-background py-2.5 text-center text-sm font-medium shadow-sm">Check your email</div></div>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">We've sent a code to {step.email}</p>
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6 && !isLoading) { const form = (e.target as HTMLElement).closest("form"); if (form) form.requestSubmit(); } }}>
                    <InputOTPGroup>{Array.from({ length: 6 }).map((_, index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>{isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />Verifying...</> : <>Verify code <ArrowRight className="ml-2 size-4" /></>}</Button>
                <Button type="button" variant="ghost" onClick={() => setStep("signIn")} disabled={isLoading} className="w-full">Use different email</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Suspense><Auth {...props} /></Suspense>;
}
