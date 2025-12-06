-- Change medications quantity to numeric to allow fractional stock (e.g. 10.5)
alter table public.medications 
  alter column quantity type numeric(10, 2) using quantity::numeric;

-- Add dose_amount to prescriptions to define how much to subtract per dose
alter table public.prescriptions 
  add column dose_amount numeric(4, 2) default 1.0;

-- Comment for clarity
comment on column public.prescriptions.dose_amount is 'Quantity of medication to consume per scheduled time (e.g. 0.5, 1.0, 2.0)';
