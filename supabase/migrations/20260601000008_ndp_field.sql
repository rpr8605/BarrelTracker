-- Add Non-Distilling Producer flag to DSP registration.
-- An NDP is a DSP that sources distillate from another producer and bottles/blends/ages it
-- without distilling. TTB-recognized status; commonly co-registered as processor + warehouseman.

alter table dsp_registration add column if not exists is_ndp boolean default false;

alter table dsp_registration add column if not exists ndp_source_details text;
-- Free text: "Sourced from MGP Indiana, contract distilled by Bardstown Bourbon Company", etc.
