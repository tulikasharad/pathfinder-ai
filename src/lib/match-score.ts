/**
 * Transparent weighted match scoring for colleges.
 *
 * Each criterion is independently normalised to 0-100, then multiplied by its
 * weight so the final sum cannot exceed 100.
 *
 * Weights (must sum to 1.00):
 *   Academic eligibility  25%
 *   Course / branch match  20%
 *   Fee compatibility      15%
 *   Ranking (placement)    15%
 *   Location               10%
 *   Scholarship            10%
 *   Other preferences       5%
 */

/** Parse a fee string like "₹2.2L" into a numeric value for comparison. */
export function parseFee(feeStr: string | null): number {
  if (!feeStr) return 0;
  const cleaned = feeStr.replace(/[₹,\s]/g, "").toLowerCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (cleaned.includes("l")) return num * 100000;
  if (cleaned.includes("k")) return num * 1000;
  if (cleaned.includes("cr")) return num * 10000000;
  return num;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export type MatchProfile = {
  academicScore?: number;
  state?: string;
  city?: string;
  course?: string;
  specialization?: string;
  category?: string;
  annualFamilyIncome?: number;
  isDisabled?: boolean;
  isMinority?: boolean;
  isFirstGeneration?: boolean;
  scholarshipRequired?: boolean;
};

export type MatchCollege = {
  ranking?: number | null;
  courses?: string[];
  state?: string;
  location?: string;
  fees?: string;
  entranceExams?: string[];
  scholarshipsAvailable?: string[];
  eligibility?: string;
};

export function calculateMatchScore(
  profile: MatchProfile | undefined,
  college: MatchCollege,
): number {
  if (!profile) return 85; // neutral fallback when profile is empty

  // 1. Academic eligibility (0-100) ────────────────────────────────────────
  let academicScore = 50;
  if (profile.academicScore != null && profile.academicScore > 0) {
    // Assume 60% is minimum eligibility, 95%+ is perfect
    academicScore = clamp(((profile.academicScore - 60) / 35) * 100, 0, 100);
  }

  // 2. Course / branch match (0-100) ──────────────────────────────────────
  let courseScore = 0;
  if (profile.course && college.courses?.length) {
    const want = profile.course.toLowerCase();
    const exactMatch = college.courses.some(
      (c) => c.toLowerCase() === want,
    );
    const partialMatch = college.courses.some(
      (c) =>
        c.toLowerCase().includes(want) || want.includes(c.toLowerCase()),
    );
    if (exactMatch) courseScore = 100;
    else if (partialMatch) courseScore = 60;
    else courseScore = 10;
  } else {
    courseScore = 50;
  }

  // 3. Fee compatibility (0-100) ──────────────────────────────────────────
  let feeScore = 50;
  const collegeFee = parseFee(college.fees ?? null);
  if (collegeFee > 0 && profile.annualFamilyIncome) {
    const ratio = collegeFee / profile.annualFamilyIncome;
    if (ratio <= 0.1) feeScore = 100;
    else if (ratio <= 0.2) feeScore = 85;
    else if (ratio <= 0.35) feeScore = 65;
    else if (ratio <= 0.5) feeScore = 40;
    else feeScore = 15;
  }

  // 4. Ranking / placement (0-100) ────────────────────────────────────────
  let rankingScore = 50;
  if (college.ranking && college.ranking > 0) {
    rankingScore = clamp(100 - (college.ranking - 1), 0, 100);
  }

  // 5. Location (0-100) ───────────────────────────────────────────────────
  let locationScore = 40;
  if (profile.state && college.state) {
    if (profile.state.toLowerCase() === college.state.toLowerCase()) {
      locationScore = 90;
    }
  }
  if (profile.city && college.location) {
    if (profile.city.toLowerCase() === college.location.toLowerCase()) {
      locationScore = 100;
    }
  }

  // 6. Scholarship (0-100) ────────────────────────────────────────────────
  let scholarshipScore = 50;
  if (profile.scholarshipRequired) {
    scholarshipScore = college.scholarshipsAvailable?.length ? 90 : 20;
  } else {
    scholarshipScore = 60;
  }

  // 7. Other preferences (0-100) ──────────────────────────────────────────
  let otherScore = 50;
  if (profile.category && college.eligibility) {
    if (
      college.eligibility.toLowerCase().includes(profile.category.toLowerCase())
    ) {
      otherScore += 20;
    }
  }
  otherScore = clamp(otherScore, 0, 100);

  // ── Weighted sum ────────────────────────────────────────────────────────
  const total =
    academicScore * 0.25 +
    courseScore * 0.20 +
    feeScore * 0.15 +
    rankingScore * 0.15 +
    locationScore * 0.10 +
    scholarshipScore * 0.10 +
    otherScore * 0.05;

  return clamp(Math.round(total), 0, 100);
}

export function classifyMatch(pct: number): "Dream" | "Target" | "Safe" {
  if (pct >= 80) return "Dream";
  if (pct >= 60) return "Target";
  return "Safe";
}
