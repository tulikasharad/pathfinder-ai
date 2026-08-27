-- =====================================================
-- 004: Fix Applications — Remove Fake Data & Prevent Duplicates
-- =====================================================
-- Run this in Supabase SQL Editor.

-- 1. Remove Northstar University — fake college that does not exist in the colleges table
DELETE FROM public.applications
WHERE name ILIKE '%Northstar%';

-- 2. Remove duplicate VIT Vellore records for the same student.
--    Keep the latest record (highest created_at) per student + name.
--    First, identify the duplicates to preserve:
WITH ranked AS (
  SELECT
    id,
    student_id,
    name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, LOWER(name)
      ORDER BY created_at DESC
    ) AS rn
  FROM public.applications
)
DELETE FROM public.applications
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 3. Add a unique constraint to prevent future duplicates.
--    This ensures one application per student per college name.
--    If your product later supports multiple courses at the same college,
--    you can drop this constraint and add a (student_id, name, course_id) unique constraint instead.
ALTER TABLE public.applications
  ADD CONSTRAINT applications_student_name_unique
  UNIQUE (student_id, name);

-- 4. Also add a unique constraint on deadline records to prevent seed duplicates
ALTER TABLE public.deadlines
  ADD CONSTRAINT deadlines_student_title_date_unique
  UNIQUE (student_id, title, date);
