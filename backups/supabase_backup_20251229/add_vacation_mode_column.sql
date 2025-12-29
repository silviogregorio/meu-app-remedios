-- Add vacation_mode column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.vacation_mode IS 'Flag to temporarily suspend all medication reminders for this user.';

-- Update RLS policies to ensure user can manage their own vacation mode
-- (Assuming existing policy "Users can update own profile" exists, this column is covered)
