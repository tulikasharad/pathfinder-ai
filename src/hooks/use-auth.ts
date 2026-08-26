import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  onboardingCompleted?: boolean;
  studentProfile?: {
    age?: number;
    state?: string;
    gender?: string;
    annualFamilyIncome?: number;
    category?: string;
    educationLevel?: string;
    schoolType?: string;
    course?: string;
    institutionType?: string;
    academicScore?: number;
    isDisabled?: boolean;
    isMinority?: boolean;
    isFirstGeneration?: boolean;
    otherCriteria?: string;
  };
}

export type AuthView =
  | "signin"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "email-confirmation"
  | "password-updated";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<AuthView>("signin");

  // ── Profile helpers ────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data) return null;

    return {
      _id: data.id,
      name: data.name,
      email: data.email,
      image: data.image,
      onboardingCompleted: data.onboarding_completed,
      studentProfile:
        data.age != null
          ? {
              age: data.age,
              state: data.state,
              gender: data.gender,
              annualFamilyIncome: data.annual_family_income,
              category: data.category,
              educationLevel: data.education_level,
              schoolType: data.school_type,
              course: data.course,
              institutionType: data.institution_type,
              academicScore: data.academic_score,
              isDisabled: data.is_disabled,
              isMinority: data.is_minority,
              isFirstGeneration: data.is_first_generation,
              otherCriteria: data.other_criteria,
            }
          : undefined,
    } as UserProfile;
  }, []);

  const ensureProfile = useCallback(
    async (
      userId: string,
      email?: string,
      name?: string
    ) => {
      const existing = await fetchProfile(userId);
      if (existing) {
        // Merge Supabase auth metadata into profile if profile is missing fields
        if (email && !existing.email) {
          await supabase
            .from("profiles")
            .update({ email })
            .eq("id", userId);
          existing.email = email;
        }
        if (name && !existing.name) {
          await supabase
            .from("profiles")
            .update({ name })
            .eq("id", userId);
          existing.name = name;
        }
        return existing;
      }

      const { data } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: email ?? null,
            name: name ?? null,
            onboarding_completed: false,
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (!data) return null;

      return {
        _id: data.id,
        name: data.name,
        email: data.email,
        image: data.image,
        onboardingCompleted: data.onboarding_completed,
        studentProfile: undefined,
      } as UserProfile;
    },
    [fetchProfile]
  );

  // ── Auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Check for password recovery tokens in the URL hash
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        // This is a password recovery link — wait for onAuthStateChange
        // to process the tokens. Don't set loading to false yet.
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setIsAuthenticated(true);
        const profile = await ensureProfile(
          session.user.id,
          session.user.email ?? undefined,
          session.user.user_metadata?.name
        );
        if (mounted) setUser(profile);
      }

      setIsLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset-password link — show new password form
        if (mounted) {
          setAuthView("reset-password");
          setIsLoading(false);
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setIsAuthenticated(true);
          const profile = await ensureProfile(
            session.user.id,
            session.user.email ?? undefined,
            session.user.user_metadata?.name
          );
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUser(null);
        if (mounted) setIsLoading(false);
      } else {
        if (session?.user) {
          setIsAuthenticated(true);
          const profile = await ensureProfile(
            session.user.id,
            session.user.email ?? undefined,
            session.user.user_metadata?.name
          );
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          if (mounted) setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  // ── Auth actions ───────────────────────────────────────────────────────────

  const signUp = useCallback(
    async (args: { email: string; password: string; name: string }) => {
      const { error } = await supabase.auth.signUp({
        email: args.email,
        password: args.password,
        options: {
          data: { name: args.name },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      setAuthView("email-confirmation");
    },
    []
  );

  const signIn = useCallback(
    async (args: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: args.email,
        password: args.password,
      });
      if (error) throw error;
      // Session is set automatically; onAuthStateChange handles the rest
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setAuthView("password-updated");
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    }
  }, [fetchProfile]);

  return {
    isLoading,
    isAuthenticated,
    user,
    authView,
    setAuthView,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    refreshProfile,
  };
}
