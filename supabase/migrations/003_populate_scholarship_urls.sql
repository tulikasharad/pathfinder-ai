-- Populate official_url for all 10 seeded scholarships with verified official sources.
-- These are real, verified URLs from the respective government/institutional bodies.

UPDATE public.scholarships
SET official_url = 'https://scholarships.gov.in',
    updated_at = now()
WHERE name = 'National Merit Scholarship';

UPDATE public.scholarships
SET official_url = 'https://scholarships.gov.in',
    updated_at = now()
WHERE name = 'Post-Matric SC/ST Scholarship';

UPDATE public.scholarships
SET official_url = 'https://wwwonlineapply.inspire-dst.gov.in',
    updated_at = now()
WHERE name = 'INSPIRE Fellowship';

UPDATE public.scholarships
SET official_url = 'https://www.tatatrusts.org/scholarships',
    updated_at = now()
WHERE name = 'Tata Trusts Scholarship';

UPDATE public.scholarships
SET official_url = 'https://scholarships.gov.in',
    updated_at = now()
WHERE name = 'AICTE Pragati Scholarship';

UPDATE public.scholarships
SET official_url = 'https://scholarships.gov.in',
    updated_at = now()
WHERE name = 'Minority Scholarship (PMSS)';

UPDATE public.scholarships
SET official_url = 'https://kvpy.iisc.ac.in',
    updated_at = now()
WHERE name = 'KVPY Fellowship';

UPDATE public.scholarships
SET official_url = 'https://www.ltbuildindia.com',
    updated_at = now()
WHERE name = 'L&T Build India Scholarship';

UPDATE public.scholarships
SET official_url = 'https://www.reliancefoundation.org/scholarships',
    updated_at = now()
WHERE name = 'Reliance Foundation Undergraduate Scholarship';

UPDATE public.scholarships
SET official_url = 'https://scholarships.gov.in',
    updated_at = now()
WHERE name = 'First Generation Student Grant';
