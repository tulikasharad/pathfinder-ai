import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  isAnonymous?: boolean;
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

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

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
      isAnonymous: data.is_anonymous,
      onboardingCompleted: data.onboarding_completed,
      studentProfile: data.age != null
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
    async (userId: string, email?: string, name?: string, isAnonymous?: boolean) => {
      const existing = await fetchProfile(userId);
      if (existing) return existing;

      const { data } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: email ?? null,
            name: name ?? null,
            is_anonymous: isAnonymous ?? false,
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
        isAnonymous: data.is_anonymous,
        onboardingCompleted: data.onboarding_completed,
        studentProfile: undefined,
      } as UserProfile;
    },
    [fetchProfile]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setIsAuthenticated(true);
        const profile = await ensureProfile(
          session.user.id,
          session.user.email ?? undefined,
          session.user.user_metadata?.name,
          session.user.is_anonymous
        );
        if (mounted) setUser(profile);
      }

      setIsLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const profile = await ensureProfile(
          session.user.id,
          session.user.email ?? undefined,
          session.user.user_metadata?.name,
          session.user.is_anonymous
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
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signIn = useCallback(
    async (provider: string, formData?: any) => {
      if (provider === "email-otp") {
        if (formData instanceof FormData) {
          const email = formData.get("email") as string;
          if (formData.get("code")) {
            const { error } = await supabase.auth.verifyOtp({
              email,
              token: formData.get("code") as string,
              type: "email",
            });
            if (error) throw error;
          } else {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
          }
        } else if (typeof formData === "string") {
          const { error } = await supabase.auth.signInWithOtp({ email: formData });
          if (error) throw error;
        }
      } else if (provider === "anonymous") {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isLoading, isAuthenticated, user, signIn, signOut };
}
