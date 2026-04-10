-- Add suggested tip amount for creators (default $5, shown in gift modal)
alter table profiles add column if not exists suggested_tip numeric(6,2) default 5.00;
