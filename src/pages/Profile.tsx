import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

const DEMO_PROFILE = {
  name: "Arjun Sharma",
  email: "arjun.sharma@gmail.com",
  gender: "Male",
  category: "General",
  state: "Maharashtra",
  city: "Mumbai",
  age: "18",
  twelfthPercentage: "87",
  studentType: "12th",
  preferredCourse: "B.Tech CSE",
  specialization: "Artificial Intelligence",
  annualFamilyIncome: "250000",
  hostelRequired: "Yes",
  scholarshipRequired: "Yes",
  preferredCities: ["Pune", "Bangalore", "Hyderabad", "Chennai"],
  annualFeeBudget: "250000",
  profileStatus: "Active",
  completionPercent: 78,
  completedSections: ["Personal info", "Academic details", "Preferences"],
  pendingSections: ["Entrance exams", "Documents"],
};

type FormState = typeof DEMO_PROFILE;

function ProfileLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

/** A profile field that shows read-only text or an editable input. */
function Field({
  label,
  displayValue,
  formKey,
  isEditing,
  onChange,
}: {
  label: string;
  displayValue: string;
  formKey: string;
  isEditing: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <ProfileLabel>{label}</ProfileLabel>
      {isEditing ? (
        <Input
          className="mt-1"
          value={displayValue}
          onChange={(e) => onChange(formKey, e.target.value)}
        />
      ) : (
        <p className="mt-1 text-base font-medium">{displayValue || "—"}</p>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable form state — starts as DEMO_PROFILE values
  const [form, setForm] = useState<FormState>({ ...DEMO_PROFILE });

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Derive the display profile from user data or DEMO_PROFILE
  const profile = useMemo(() => {
    const sp = user?.studentProfile;
    if (sp) {
      // Build profile from whatever data exists — don't require age
      return {
        name: user.name || DEMO_PROFILE.name,
        email: user.email || DEMO_PROFILE.email,
        age: sp.age != null ? String(sp.age) : DEMO_PROFILE.age,
        gender: sp.gender || DEMO_PROFILE.gender,
        category: sp.category || DEMO_PROFILE.category,
        state: sp.state || DEMO_PROFILE.state,
        city: sp.city || DEMO_PROFILE.city,
        twelfthPercentage: sp.academicScore != null ? String(sp.academicScore) : DEMO_PROFILE.twelfthPercentage,
        studentType: sp.educationLevel || DEMO_PROFILE.studentType,
        preferredCourse: sp.course || DEMO_PROFILE.preferredCourse,
        specialization: sp.specialization || DEMO_PROFILE.specialization,
        annualFamilyIncome: sp.annualFamilyIncome != null ? String(sp.annualFamilyIncome) : DEMO_PROFILE.annualFamilyIncome,
        hostelRequired: sp.hostelRequired != null ? (sp.hostelRequired ? "Yes" : "No") : DEMO_PROFILE.hostelRequired,
        scholarshipRequired: sp.scholarshipRequired != null ? (sp.scholarshipRequired ? "Yes" : "No") : DEMO_PROFILE.scholarshipRequired,
        preferredCities: DEMO_PROFILE.preferredCities,
        annualFeeBudget: sp.annualFamilyIncome != null ? String(sp.annualFamilyIncome) : DEMO_PROFILE.annualFeeBudget,
        profileStatus: "Active",
        completionPercent: user.onboardingCompleted ? 100 : 50,
        completedSections: ["Personal info", "Academic details"],
        pendingSections: ["Entrance exams", "Documents", "Preferences"],
      };
    }
    return DEMO_PROFILE;
  }, [user]);

  const startEditing = useCallback(() => {
    // Copy ALL current profile values into form
    setForm({
      name: profile.name,
      email: profile.email,
      age: profile.age,
      gender: profile.gender,
      category: profile.category,
      state: profile.state,
      city: profile.city,
      twelfthPercentage: profile.twelfthPercentage,
      studentType: profile.studentType,
      preferredCourse: profile.preferredCourse,
      specialization: profile.specialization,
      annualFamilyIncome: profile.annualFamilyIncome,
      hostelRequired: profile.hostelRequired,
      scholarshipRequired: profile.scholarshipRequired,
      preferredCities: profile.preferredCities,
      annualFeeBudget: profile.annualFeeBudget,
      profileStatus: profile.profileStatus,
      completionPercent: profile.completionPercent,
      completedSections: profile.completedSections,
      pendingSections: profile.pendingSections,
    });
    setIsEditing(true);
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!user?._id) {
      toast.error("Not authenticated. Please sign in again.");
      return;
    }

    setIsSaving(true);
    try {
      // Only send columns that exist in the profiles table (see migration 001 + 002)
      const updates: Record<string, unknown> = {
        name: form.name || null,
        gender: form.gender || null,
        category: form.category || null,
        state: form.state || null,
        city: form.city || null,
        education_level: form.studentType || null,
        course: form.preferredCourse || null,
        specialization: form.specialization || null,
        academic_score: form.twelfthPercentage ? Number(form.twelfthPercentage) || null : null,
        annual_family_income: form.annualFamilyIncome ? Number(form.annualFamilyIncome) || null : null,
        age: form.age ? Number(form.age) || null : null,
        hostel_required: form.hostelRequired === "Yes",
        scholarship_required: form.scholarshipRequired === "Yes",
        onboarding_completed: true,
      };

      console.log("[Profile save] Sending to Supabase:", updates);

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user._id)
        .select()
        .single();

      if (error) {
        console.error("[Profile save] Supabase error:", error.message, error.details, error.hint);
        toast.error(`Save failed: ${error.message}`);
        return;
      }

      console.log("[Profile save] Updated row:", data);

      // Refresh profile from DB to reflect changes
      await refreshProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("[Profile save] Unexpected error:", err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  }, [user, form, refreshProfile]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="mt-1 text-muted-foreground">
              Your academic details power every match and recommendation.
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={startEditing}>
                Edit profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Information */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Personal Information</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="Full Name" displayValue={isEditing ? form.name : profile.name} formKey="name" isEditing={isEditing} onChange={setField} />
                <Field label="Email" displayValue={profile.email} formKey="email" isEditing={false} onChange={setField} />
                <Field label="Age" displayValue={isEditing ? form.age : profile.age} formKey="age" isEditing={isEditing} onChange={setField} />
                <Field label="Gender" displayValue={isEditing ? form.gender : profile.gender} formKey="gender" isEditing={isEditing} onChange={setField} />
                <Field label="Category" displayValue={isEditing ? form.category : profile.category} formKey="category" isEditing={isEditing} onChange={setField} />
                <Field label="State" displayValue={isEditing ? form.state : profile.state} formKey="state" isEditing={isEditing} onChange={setField} />
              </div>
            </div>

            {/* Academic Details */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Academic Details</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="12th Percentage" displayValue={isEditing ? form.twelfthPercentage : profile.twelfthPercentage} formKey="twelfthPercentage" isEditing={isEditing} onChange={setField} />
                <Field label="Student Type" displayValue={isEditing ? form.studentType : profile.studentType} formKey="studentType" isEditing={isEditing} onChange={setField} />
                <Field label="Preferred Course" displayValue={isEditing ? form.preferredCourse : profile.preferredCourse} formKey="preferredCourse" isEditing={isEditing} onChange={setField} />
                <Field label="Specialization" displayValue={isEditing ? form.specialization : profile.specialization} formKey="specialization" isEditing={isEditing} onChange={setField} />
              </div>
            </div>

            {/* Financial Preferences */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Financial Preferences</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="Annual Family Income" displayValue={isEditing ? form.annualFamilyIncome : profile.annualFamilyIncome} formKey="annualFamilyIncome" isEditing={isEditing} onChange={setField} />
                <Field label="Hostel Required" displayValue={isEditing ? form.hostelRequired : profile.hostelRequired} formKey="hostelRequired" isEditing={isEditing} onChange={setField} />
                <Field label="Scholarship Required" displayValue={isEditing ? form.scholarshipRequired : profile.scholarshipRequired} formKey="scholarshipRequired" isEditing={isEditing} onChange={setField} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Profile Completion</ProfileLabel>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Overall completeness</p>
                  <p className="text-sm font-bold text-primary">{profile.completionPercent}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${profile.completionPercent}%` }}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {profile.completedSections.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                  {profile.pendingSections.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Saved Preferences</ProfileLabel>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <ProfileLabel>Preferred cities</ProfileLabel>
                  <p className="text-sm font-medium text-right">
                    {profile.preferredCities.join(", ")}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Annual fee budget</ProfileLabel>
                  <p className="text-sm font-medium">{profile.annualFeeBudget}</p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Course</ProfileLabel>
                  <p className="text-sm font-medium">{profile.preferredCourse}</p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Profile status</ProfileLabel>
                  <p className="text-sm font-medium text-emerald-400">{profile.profileStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
