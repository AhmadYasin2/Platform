-- Seed services & packages from Cohort 3 pricing
BEGIN;

-- NOTE: Schema has no providers table. We encode provider into service.name as "<Category> – <Provider>".
-- NOTE: Prices in the sheet include taxes; fractional JOD were rounded to nearest integer to satisfy `price INT`.

-- Service: Finance – Al Khebrat
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Finance – Al Khebrat', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Finance – Al Khebrat');


-- Package: Package 1 ( 5 hrs) under Finance – Al Khebrat
WITH s AS (
  SELECT id FROM services WHERE name = 'Finance – Al Khebrat'
),
up AS (
  UPDATE packages
     SET description = NULL,
         price = 290,
         hours = 5,
         updated_at = NOW()
   WHERE service_id = (SELECT id FROM s) AND name = 'Package 1 ( 5 hrs)'
 RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 290, 5, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id = (SELECT id FROM s) AND name = 'Package 1 ( 5 hrs)');

-- Package: Package 2 (10 hrs) under Finance – Al Khebrat
WITH s AS (
  SELECT id FROM services WHERE name = 'Finance – Al Khebrat'
),
up AS (
  UPDATE packages
     SET description = NULL,
         price = 435,
         hours = 10,
         updated_at = NOW()
   WHERE service_id = (SELECT id FROM s) AND name = 'Package 2 (10 hrs)'
 RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 435, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id = (SELECT id FROM s) AND name = 'Package 2 (10 hrs)');

-- Package: Package 3 (15 hrs) under Finance – Al Khebrat
WITH s AS (
  SELECT id FROM services WHERE name = 'Finance – Al Khebrat'
),
up AS (
  UPDATE packages
     SET description = NULL,
         price = 508,
         hours = 15,
         updated_at = NOW()
   WHERE service_id = (SELECT id FROM s) AND name = 'Package 3 (15 hrs)'
 RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 508, 15, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id = (SELECT id FROM s) AND name = 'Package 3 (15 hrs)');

-- Package: Package 4 (20 hrs) under Finance – Al Khebrat
WITH s AS (
  SELECT id FROM services WHERE name = 'Finance – Al Khebrat'
),
up AS (
  UPDATE packages
     SET description = NULL,
         price = 544,
         hours = 20,
         updated_at = NOW()
   WHERE service_id = (SELECT id FROM s) AND name = 'Package 4 (20 hrs)'
 RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 544, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id = (SELECT id FROM s) AND name = 'Package 4 (20 hrs)');

-- Service: Legal – Laith “Moh’d Saad” Salem Nabulsi
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Legal – Laith “Moh’d Saad” Salem Nabulsi', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Legal – Laith “Moh’d Saad” Salem Nabulsi');

-- Package: Package 1 ( 5 hrs) under Legal – Laith “Moh’d Saad” Salem Nabulsi
WITH s AS (SELECT id FROM services WHERE name = 'Legal – Laith “Moh’d Saad” Salem Nabulsi'),
up AS (
  UPDATE packages SET description=NULL, price=250, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 250, 5, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)');

-- Package: Package 2 (10 hrs) under Legal – Laith “Moh’d Saad” Salem Nabulsi
WITH s AS (SELECT id FROM services WHERE name = 'Legal – Laith “Moh’d Saad” Salem Nabulsi'),
up AS (
  UPDATE packages SET description=NULL, price=500, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 500, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)');

-- Package: Package 3 (15 hrs) under Legal – Laith “Moh’d Saad” Salem Nabulsi
WITH s AS (SELECT id FROM services WHERE name = 'Legal – Laith “Moh’d Saad” Salem Nabulsi'),
up AS (
  UPDATE packages SET description=NULL, price=750, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 750, 15, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)');

-- Package: Package 4 (20 hrs) under Legal – Laith “Moh’d Saad” Salem Nabulsi
WITH s AS (SELECT id FROM services WHERE name = 'Legal – Laith “Moh’d Saad” Salem Nabulsi'),
up AS (
  UPDATE packages SET description=NULL, price=1000, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 1000, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM up)
  AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

-- Service: Branding – O'Minus
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Branding – O''Minus', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Branding – O''Minus');

-- Packages for Branding – O'Minus
WITH s AS (SELECT id FROM services WHERE name = 'Branding – O''Minus'),
p1 AS (
  UPDATE packages SET description=NULL, price=500, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
), i1 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 500, 5, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p1) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)')
  RETURNING id
), p2 AS (
  UPDATE packages SET description=NULL, price=800, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
), i2 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 800, 10, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p2) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)')
  RETURNING id
), p3 AS (
  UPDATE packages SET description=NULL, price=975, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
), i3 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 975, 15, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p3) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)')
  RETURNING id
), p4 AS (
  UPDATE packages SET description=NULL, price=1100, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 1100, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM p4) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

-- Service: Marketing – عبدالرحمن عامر خميس الدلق
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Marketing – عبدالرحمن عامر خميس الدلق', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Marketing – عبدالرحمن عامر خميس الدلق');

WITH s AS (SELECT id FROM services WHERE name = 'Marketing – عبدالرحمن عامر خميس الدلق')
, p1 AS (
  UPDATE packages SET description=NULL, price=250, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
), i1 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 250, 5, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p1) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)')
  RETURNING id
), p2 AS (
  UPDATE packages SET description=NULL, price=500, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
), i2 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 500, 10, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p2) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)')
  RETURNING id
), p3 AS (
  UPDATE packages SET description=NULL, price=650, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
), i3 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 650, 15, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p3) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)')
  RETURNING id
), p4 AS (
  UPDATE packages SET description=NULL, price=1000, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 1000, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM p4) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

-- Service: Prototyping – Twelve Degrees
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Prototyping – Twelve Degrees', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Prototyping – Twelve Degrees');

WITH s AS (SELECT id FROM services WHERE name = 'Prototyping – Twelve Degrees')
, p1 AS (
  UPDATE packages SET description=NULL, price=325, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
), i1 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 325, 5, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p1) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)')
  RETURNING id
), p2 AS (
  UPDATE packages SET description=NULL, price=650, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
), i2 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 650, 10, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p2) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)')
  RETURNING id
), p3 AS (
  UPDATE packages SET description=NULL, price=950, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
), i3 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 950, 15, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p3) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)')
  RETURNING id
), p4 AS (
  UPDATE packages SET description=NULL, price=1250, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 1250, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM p4) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

-- Service: AI – Hijazi Natsheh
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'AI – Hijazi Natsheh', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'AI – Hijazi Natsheh');

WITH s AS (SELECT id FROM services WHERE name = 'AI – Hijazi Natsheh')
, p1 AS (
  UPDATE packages SET description=NULL, price=300, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
), i1 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 300, 5, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p1) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)')
  RETURNING id
), p2 AS (
  UPDATE packages SET description=NULL, price=550, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
), i2 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 550, 10, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p2) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)')
  RETURNING id
), p3 AS (
  UPDATE packages SET description=NULL, price=759, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
), i3 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 759, 15, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p3) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)')
  RETURNING id
), p4 AS (
  UPDATE packages SET description=NULL, price=900, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 900, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM p4) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

-- Service: IT – حمزة فواز يونس ابوغزالة
INSERT INTO services (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'IT – حمزة فواز يونس ابوغزالة', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'IT – حمزة فواز يونس ابوغزالة');

WITH s AS (SELECT id FROM services WHERE name = 'IT – حمزة فواز يونس ابوغزالة')
, p1 AS (
  UPDATE packages SET description=NULL, price=158, hours=5, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)'
  RETURNING id
), i1 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 1 ( 5 hrs)', NULL, 158, 5, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p1) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 1 ( 5 hrs)')
  RETURNING id
), p2 AS (
  UPDATE packages SET description=NULL, price=315, hours=10, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)'
  RETURNING id
), i2 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 2 (10 hrs)', NULL, 315, 10, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p2) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 2 (10 hrs)')
  RETURNING id
), p3 AS (
  UPDATE packages SET description=NULL, price=402, hours=15, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)'
  RETURNING id
), i3 AS (
  INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 3 (15 hrs)', NULL, 402, 15, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM p3) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 3 (15 hrs)')
  RETURNING id
), p4 AS (
  UPDATE packages SET description=NULL, price=520, hours=20, updated_at=NOW()
  WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)'
  RETURNING id
)
INSERT INTO packages (id, service_id, name, description, price, hours, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM s), 'Package 4 (20 hrs)', NULL, 520, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM p4) AND NOT EXISTS (SELECT 1 FROM packages WHERE service_id=(SELECT id FROM s) AND name='Package 4 (20 hrs)');

COMMIT;
