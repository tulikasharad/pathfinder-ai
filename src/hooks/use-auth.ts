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
    city?: string;
    specialization?: string;
    hostelRequired?: boolean;
    scholarshipRequired?: boolean;
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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[fetchProfile] Supabase error:", error.message, error.details, error.hint);
      return null;
    }
    if (!data) return null;

    // Build studentProfile from ANY available data — don't gate on age
    const sp: NonNullable<UserProfile["studentProfile"]> = {};
    if (data.age != null) sp.age = data.age;
    if (data.state) sp.state = data.state;
    if (data.gender) sp.gender = data.gender;
    if (data.annual_family_income != null) sp.annualFamilyIncome = data.annual_family_income;
    if (data.category) sp.category = data.category;
    if (data.education_level) sp.educationLevel = data.education_level;
    if (data.school_type) sp.schoolType = data.school_type;
    if (data.course) sp.course = data.course;
    if (data.institution_type) sp.institutionType = data.institution_type;
    if (data.academic_score != null) sp.academicScore = data.academic_score;
    if (data.is_disabled != null) sp.isDisabled = data.is_disabled;
    if (data.is_minority != null) sp.isMinority = data.is_minority;
    if (data.is_first_generation != null) sp.isFirstGeneration = data.is_first_generation;
    if (data.other_criteria) sp.otherCriteria = data.other_criteria;
    if (data.city) sp.city = data.city;
    if (data.specialization) sp.specialization = data.specialization;
    if (data.hostel_required != null) sp.hostelRequired = data.hostel_required;
    if (data.scholarship_required != null) sp.scholarshipRequired = data.scholarship_required;

    return {
      _id: data.id,
      name: data.name,
      email: data.email,
      image: data.image,
      onboardingCompleted: data.onboarding_completed,
      // Only set studentProfile if there's at least some profile data
      studentProfile: Object.keys(sp).length > 0 ? sp : undefined,
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

      const { data, error } = await supabase
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

      if (error) {
        console.error("[ensureProfile] Supabase error:", error.message);
        return null;
      }
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
