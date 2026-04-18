-- ═══════════════════════════════════════════════════════
-- GastroConnect CRM - Supabase Database Migration
-- Centro De Formación Gastronómico Milagro
-- ═══════════════════════════════════════════════════════

-- Run this SQL in your Supabase Dashboard → SQL Editor

-- ── Categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#25D366',
  icon TEXT DEFAULT '👤',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contacts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_seguimiento', 'inscrito', 'egresado', 'inactivo')),
  notes TEXT,
  tags TEXT[],
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Message Templates ───────────────────────────────────
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[],
  icon TEXT DEFAULT '💬',
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Conversations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  message_sent TEXT NOT NULL,
  direction TEXT DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
  channel TEXT DEFAULT 'whatsapp',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auto Responses ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords TEXT[] NOT NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Business Settings ───────────────────────────────────
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Centro De Formación Gastronómico Milagro',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  address TEXT,
  phone TEXT,
  email TEXT,
  facebook_url TEXT,
  working_hours JSONB,
  welcome_message TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quick Notes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- Row Level Security (RLS) - Allow public access for now
-- In production, add proper auth policies!
-- ═══════════════════════════════════════════════════════

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (anon key)
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON message_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON auto_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON business_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON quick_notes FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_responses_active ON auto_responses(is_active, priority);
