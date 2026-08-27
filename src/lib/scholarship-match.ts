/**
 * Deterministic scholarship eligibility and matching engine.
 *
 * Every criterion is independently normalized to 0-1, then combined with
 * fixed weights that sum to exactly 1.0. The final percentage is clamped
 * to 0-100 and can never exceed 100%.
 *
 * No LLM or API call determines eligibility — this is purely rule-based.
 */

export type EligibilityStatus = "eligible" | "likely_eligible" | "not_eligible" | "insufficient_info";

export interface ScholarshipProfile {
  academicScore?: number;  // percentage
  annualFamilyIncome?: number;
  category?: string;
  gender?: string;
  state?: string;
  educationLevel?: string;
  course?: string;
  age?: number;
}

export interface ScholarshipData {
  minScore?: number | null;
  maxIncome?: number | null;
  category?: string | null;
  gender?: string | null;
  state?: string | null;
  educationLevel?: string | null;
  course?: string | null;
}

export interface MatchResult {
  matchPercentage: number;
  eligibility: EligibilityStatus;
  reasons: string[];
  criteriaDetails: {
    name: string;
    met: boolean;
    required: boolean;
    detail: string;
  }[];
}

/**
 * Normalize a scholarship match to 0-100 with proper weights.
 *
 * Weights:
 *  - Academic score:     25%
 *  - Income:             20%
 *  - Category:           15%
 *  - Gender:             10%
 *  - State:              10%
 *  - Education level:    10%
 *  - Course:             10%
 *
 * Total = 100%
 */
export function calculateScholarshipMatch(
  scholarship: ScholarshipData,
  profile: ScholarshipProfile
): MatchResult {
  const reasons: string[] = [];
  const criteriaDetails: MatchResult["criteriaDetails"] = [];
  let totalWeight = 0;
  let weightedScore = 0;
  let hasRequiredMissing = false;
  let requiredCount = 0;
  let metRequiredCount = 0;

  // ── 1. Academic score (25%) ───────────────────────────────────────────
  const academicWeight = 0.25;
  const hasScoreReq = scholarship.minScore != null && scholarship.minScore > 0;
  const hasProfileScore = profile.academicScore != null && profile.academicScore > 0;

  if (hasScoreReq) {
    requiredCount++;
    totalWeight += academicWeight;
    if (hasProfileScore) {
      if (profile.academicScore! >= scholarship.minScore!) {
        const ratio = Math.min(profile.academicScore! / scholarship.minScore!, 1.2);
        const score = Math.min(ratio * academicWeight, academicWeight);
        weightedScore += score;
        metRequiredCount++;
        reasons.push(`✓ Academic score (${profile.academicScore}%) meets minimum ${scholarship.minScore}%`);
        criteriaDetails.push({ name: "Academic Score", met: true, required: true, detail: `${profile.academicScore}% ≥ ${scholarship.minScore}%` });
      } else {
        const ratio = profile.academicScore! / scholarship.minScore!;
        weightedScore += ratio * academicWeight * 0.3; // partial credit
        reasons.push(`✗ Academic score (${profile.academicScore}%) below required ${scholarship.minScore}%`);
        criteriaDetails.push({ name: "Academic Score", met: false, required: true, detail: `${profile.academicScore}% < ${scholarship.minScore}%` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Academic score not provided");
      criteriaDetails.push({ name: "Academic Score", met: false, required: true, detail: "Score not provided" });
    }
  } else {
    totalWeight += academicWeight;
    weightedScore += academicWeight; // full credit when no requirement
    reasons.push("✓ No minimum score requirement");
    criteriaDetails.push({ name: "Academic Score", met: true, required: false, detail: "No requirement" });
  }

  // ── 2. Income (20%) ───────────────────────────────────────────────────
  const incomeWeight = 0.20;
  const hasIncomeReq = scholarship.maxIncome != null && scholarship.maxIncome > 0;
  const hasProfileIncome = profile.annualFamilyIncome != null && profile.annualFamilyIncome > 0;

  if (hasIncomeReq) {
    requiredCount++;
    totalWeight += incomeWeight;
    if (hasProfileIncome) {
      if (profile.annualFamilyIncome! <= scholarship.maxIncome!) {
        weightedScore += incomeWeight;
        metRequiredCount++;
        reasons.push(`✓ Family income (₹${(profile.annualFamilyIncome! / 100000).toFixed(1)}L) within limit of ₹${(scholarship.maxIncome! / 100000).toFixed(1)}L`);
        criteriaDetails.push({ name: "Family Income", met: true, required: true, detail: `₹${(profile.annualFamilyIncome! / 100000).toFixed(1)}L ≤ ₹${(scholarship.maxIncome! / 100000).toFixed(1)}L` });
      } else {
        reasons.push(`✗ Family income (₹${(profile.annualFamilyIncome! / 100000).toFixed(1)}L) exceeds limit of ₹${(scholarship.maxIncome! / 100000).toFixed(1)}L`);
        criteriaDetails.push({ name: "Family Income", met: false, required: true, detail: `₹${(profile.annualFamilyIncome! / 100000).toFixed(1)}L > ₹${(scholarship.maxIncome! / 100000).toFixed(1)}L` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Family income not provided — cannot determine eligibility");
      criteriaDetails.push({ name: "Family Income", met: false, required: true, detail: "Income not provided" });
    }
  } else {
    totalWeight += incomeWeight;
    weightedScore += incomeWeight;
    reasons.push("✓ No income restriction");
    criteriaDetails.push({ name: "Family Income", met: true, required: false, detail: "No requirement" });
  }

  // ── 3. Category (15%) ─────────────────────────────────────────────────
  const categoryWeight = 0.15;
  const hasCategoryReq = scholarship.category && scholarship.category !== "general" && scholarship.category !== "all";
  const hasProfileCategory = !!profile.category;

  if (hasCategoryReq) {
    requiredCount++;
    totalWeight += categoryWeight;
    if (hasProfileCategory) {
      if (profile.category!.toLowerCase() === scholarship.category!.toLowerCase()) {
        weightedScore += categoryWeight;
        metRequiredCount++;
        reasons.push(`✓ Category (${profile.category}) matches requirement (${scholarship.category})`);
        criteriaDetails.push({ name: "Category", met: true, required: true, detail: `${profile.category} = ${scholarship.category}` });
      } else {
        reasons.push(`✗ Requires ${scholarship.category} category, you are ${profile.category}`);
        criteriaDetails.push({ name: "Category", met: false, required: true, detail: `${profile.category} ≠ ${scholarship.category}` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Category not provided");
      criteriaDetails.push({ name: "Category", met: false, required: true, detail: "Not provided" });
    }
  } else {
    totalWeight += categoryWeight;
    weightedScore += categoryWeight;
    reasons.push("✓ Open to all categories");
    criteriaDetails.push({ name: "Category", met: true, required: false, detail: "Open to all" });
  }

  // ── 4. Gender (10%) ───────────────────────────────────────────────────
  const genderWeight = 0.10;
  const hasGenderReq = scholarship.gender && scholarship.gender !== "all" && scholarship.gender !== "any";
  const hasProfileGender = !!profile.gender;

  if (hasGenderReq) {
    requiredCount++;
    totalWeight += genderWeight;
    if (hasProfileGender) {
      if (profile.gender!.toLowerCase() === scholarship.gender!.toLowerCase()) {
        weightedScore += genderWeight;
        metRequiredCount++;
        reasons.push(`✓ Gender eligibility confirmed`);
        criteriaDetails.push({ name: "Gender", met: true, required: true, detail: `${profile.gender} = ${scholarship.gender}` });
      } else {
        reasons.push(`✗ Restricted to ${scholarship.gender} candidates`);
        criteriaDetails.push({ name: "Gender", met: false, required: true, detail: `${profile.gender} ≠ ${scholarship.gender}` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Gender not provided");
      criteriaDetails.push({ name: "Gender", met: false, required: true, detail: "Not provided" });
    }
  } else {
    totalWeight += genderWeight;
    weightedScore += genderWeight;
    reasons.push("✓ Open to all genders");
    criteriaDetails.push({ name: "Gender", met: true, required: false, detail: "Open to all" });
  }

  // ── 5. State (10%) ────────────────────────────────────────────────────
  const stateWeight = 0.10;
  const hasStateReq = scholarship.state && scholarship.state !== "all";
  const hasProfileState = !!profile.state;

  if (hasStateReq) {
    requiredCount++;
    totalWeight += stateWeight;
    if (hasProfileState) {
      if (profile.state!.toLowerCase() === scholarship.state!.toLowerCase()) {
        weightedScore += stateWeight;
        metRequiredCount++;
        reasons.push(`✓ State eligibility confirmed (${profile.state})`);
        criteriaDetails.push({ name: "State", met: true, required: true, detail: `${profile.state} = ${scholarship.state}` });
      } else {
        reasons.push(`✗ Only for ${scholarship.state} residents`);
        criteriaDetails.push({ name: "State", met: false, required: true, detail: `${profile.state} ≠ ${scholarship.state}` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ State not provided");
      criteriaDetails.push({ name: "State", met: false, required: true, detail: "Not provided" });
    }
  } else {
    totalWeight += stateWeight;
    weightedScore += stateWeight;
    reasons.push("✓ Available across all states");
    criteriaDetails.push({ name: "State", met: true, required: false, detail: "Open to all" });
  }

  // ── 6. Education level (10%) ──────────────────────────────────────────
  const eduWeight = 0.10;
  const hasEduReq = !!scholarship.educationLevel;
  const hasProfileEdu = !!profile.educationLevel;

  if (hasEduReq) {
    requiredCount++;
    totalWeight += eduWeight;
    if (hasProfileEdu) {
      if (profile.educationLevel!.toLowerCase() === scholarship.educationLevel!.toLowerCase()) {
        weightedScore += eduWeight;
        metRequiredCount++;
        reasons.push(`✓ Education level matches`);
        criteriaDetails.push({ name: "Education Level", met: true, required: true, detail: `${profile.educationLevel} = ${scholarship.educationLevel}` });
      } else {
        reasons.push(`✗ Requires ${scholarship.educationLevel} level`);
        criteriaDetails.push({ name: "Education Level", met: false, required: true, detail: `${profile.educationLevel} ≠ ${scholarship.educationLevel}` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Education level not provided");
      criteriaDetails.push({ name: "Education Level", met: false, required: true, detail: "Not provided" });
    }
  } else {
    totalWeight += eduWeight;
    weightedScore += eduWeight;
    reasons.push("✓ Open to all education levels");
    criteriaDetails.push({ name: "Education Level", met: true, required: false, detail: "Open to all" });
  }

  // ── 7. Course (10%) ───────────────────────────────────────────────────
  const courseWeight = 0.10;
  const hasCourseReq = !!scholarship.course;
  const hasProfileCourse = !!profile.course;

  if (hasCourseReq) {
    requiredCount++;
    totalWeight += courseWeight;
    if (hasProfileCourse) {
      if (profile.course!.toLowerCase() === scholarship.course!.toLowerCase()) {
        weightedScore += courseWeight;
        metRequiredCount++;
        reasons.push(`✓ Course match confirmed`);
        criteriaDetails.push({ name: "Course", met: true, required: true, detail: `${profile.course} = ${scholarship.course}` });
      } else {
        reasons.push(`✗ Restricted to ${scholarship.course} students`);
        criteriaDetails.push({ name: "Course", met: false, required: true, detail: `${profile.course} ≠ ${scholarship.course}` });
      }
    } else {
      hasRequiredMissing = true;
      reasons.push("○ Course not provided");
      criteriaDetails.push({ name: "Course", met: false, required: true, detail: "Not provided" });
    }
  } else {
    totalWeight += courseWeight;
    weightedScore += courseWeight;
    reasons.push("✓ Open to all courses");
    criteriaDetails.push({ name: "Course", met: true, required: false, detail: "Open to all" });
  }

  // ── Final calculation ──────────────────────────────────────────────────
  const matchPercentage = totalWeight > 0
    ? Math.min(100, Math.max(0, Math.round((weightedScore / totalWeight) * 100)))
    : 50;

  // ── Eligibility classification ─────────────────────────────────────────
  let eligibility: EligibilityStatus;

  if (hasRequiredMissing && requiredCount > 0) {
    // Some required conditions cannot be evaluated
    if (metRequiredCount === requiredCount - 1 && matchPercentage >= 70) {
      eligibility = "likely_eligible";
    } else {
      eligibility = "insufficient_info";
    }
  } else if (requiredCount === 0) {
    // No specific requirements — open to all
    eligibility = "likely_eligible";
  } else if (metRequiredCount === requiredCount) {
    // All required conditions met
    eligibility = "eligible";
  } else if (metRequiredCount >= requiredCount * 0.7) {
    // Most required conditions met
    eligibility = "likely_eligible";
  } else {
    // Fails one or more required conditions
    eligibility = "not_eligible";
  }

  return { matchPercentage, eligibility, reasons, criteriaDetails };
}

/** Human-readable eligibility label */
export function eligibilityLabel(status: EligibilityStatus): string {
  switch (status) {
    case "eligible": return "Eligible";
    case "likely_eligible": return "Likely Eligible";
    case "not_eligible": return "Not Eligible";
    case "insufficient_info": return "Insufficient Info";
  }
}

/** Tailwind class for eligibility badge */
export function eligibilityColor(status: EligibilityStatus): string {
  switch (status) {
    case "eligible": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "likely_eligible": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "not_eligible": return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "insufficient_info": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
}

/** Deadline urgency classification */
export function deadlineUrgency(deadline: string | null): { label: string; color: string; daysLeft: number } {
  if (!deadline) return { label: "No deadline", color: "text-muted-foreground", daysLeft: 999 };
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "text-muted-foreground", daysLeft };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: "text-red-500 font-bold", daysLeft };
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: "text-orange-500 font-semibold", daysLeft };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: "text-amber-500", daysLeft };
  return { label: `${daysLeft}d left`, color: "text-muted-foreground", daysLeft };
}
