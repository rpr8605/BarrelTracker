-- 20260604000000_command_center_demo.sql

-- Action Center Items
CREATE TABLE public.action_center_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    module TEXT NOT NULL, -- 'operations', 'compliance', 'finance', 'barrel_repository', etc.
    entity_type TEXT,
    entity_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'info', -- 'critical', 'high', 'medium', 'low', 'info'
    status TEXT NOT NULL DEFAULT 'detected', -- 'detected', 'assigned', 'in_progress', 'resolved', 'dismissed'
    assigned_to UUID REFERENCES auth.users(id),
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    auto_resolution_rule JSONB,
    recommended_actions JSONB
);

ALTER TABLE public.action_center_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Action center items visible to distillery users" ON public.action_center_items FOR SELECT USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));
CREATE POLICY "Action center items insertable by distillery users" ON public.action_center_items FOR INSERT WITH CHECK (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));
CREATE POLICY "Action center items updatable by distillery users" ON public.action_center_items FOR UPDATE USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));

-- Report Snapshots
CREATE TABLE public.report_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    time_window TEXT,
    metrics_json JSONB,
    summary TEXT,
    good_changes JSONB,
    warnings JSONB,
    blockers JSONB,
    recommended_actions JSONB
);

ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report snapshots visible to distillery users" ON public.report_snapshots FOR SELECT USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));
CREATE POLICY "Report snapshots insertable by distillery users" ON public.report_snapshots FOR INSERT WITH CHECK (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));

-- Saved Barrel Views
CREATE TABLE public.saved_barrel_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filter_json JSONB,
    sort_json JSONB,
    group_by TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_barrel_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saved views visible to distillery users" ON public.saved_barrel_views FOR ALL USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));

-- Custom Barrel Lists
CREATE TABLE public.custom_barrel_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_barrel_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barrel lists visible to distillery users" ON public.custom_barrel_lists FOR ALL USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));

CREATE TABLE public.custom_barrel_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.custom_barrel_lists(id) ON DELETE CASCADE,
    barrel_id UUID NOT NULL REFERENCES public.barrels(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_barrel_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "List items visible to distillery users" ON public.custom_barrel_list_items FOR ALL USING (list_id IN (SELECT id FROM public.custom_barrel_lists WHERE distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid())));

-- Marketing Campaigns
CREATE TABLE public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    goals TEXT,
    metrics_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns visible to distillery users" ON public.marketing_campaigns FOR ALL USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));

-- Notification Rules
CREATE TABLE public.notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    channels JSONB NOT NULL, -- e.g., ["in-app", "email"]
    severity_threshold TEXT,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notification rules visible to distillery users" ON public.notification_rules FOR ALL USING (distillery_id IN (SELECT distillery_id FROM public.user_roles WHERE user_id = auth.uid() UNION SELECT id FROM public.distilleries WHERE owner_id = auth.uid()));
