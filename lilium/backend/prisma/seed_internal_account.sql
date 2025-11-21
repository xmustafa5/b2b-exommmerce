-- Create Lilium Internal Team Account
-- This account is used by Lilium team to create vendor and shop owner accounts
-- Email: lilium@lilium.iq
-- Password: lilium@123

-- First, let's create the hashed password for lilium@123
-- The hash below is for password: lilium@123 (using bcrypt with 10 rounds)
-- In production, generate this hash using: bcrypt.hash('lilium@123', 10)

-- Insert the SUPER_ADMIN account for Lilium team
INSERT INTO "User" (
  id,
  email,
  password,
  name,
  businessName,
  phone,
  role,
  zones,
  "isActive",
  "emailVerified",
  "phoneVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'lilium@lilium.iq',
  '$2b$10$Xr6KpQTHSBYzlMHG7AJYCe5oEzU1zG9sPzV7p7J0h0Vj8LgqJBgKu', -- bcrypt hash of 'lilium@123'
  'Lilium Team',
  'Lilium Development',
  '+9647901234567',
  'SUPER_ADMIN',
  ARRAY['KARKH', 'RUSAFA']::public."Zone"[],
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "isActive" = true,
  "updatedAt" = NOW()
WHERE "User".email = 'lilium@lilium.iq';

-- Output confirmation
SELECT
  id,
  email,
  name,
  role,
  "isActive",
  "createdAt"
FROM "User"
WHERE email = 'lilium@lilium.iq';

-- Note: After running this script, the Lilium team can login to the internal API using:
-- POST /api/internal/login
-- {
--   "email": "lilium@lilium.iq",
--   "password": "lilium@123"
-- }
--
-- This will return a JWT token that can be used to create vendor and shop owner accounts.