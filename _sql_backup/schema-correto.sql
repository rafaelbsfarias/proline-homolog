-- Schema conforme fornecido pelo usuário

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela profiles (espelha a estrutura do Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'partner', 'specialist', 'admin')),
    email_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar tabela clients
CREATE TABLE IF NOT EXISTS clients (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT,
    document_number TEXT,
    address TEXT,
    cep TEXT,
    parqueamento NUMERIC(10, 2),
    quilometragem TEXT,
    percentual_fipe NUMERIC(5, 2),
    taxa_operacao NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar tabela partners
CREATE TABLE IF NOT EXISTS partners (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    cnpj TEXT,
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Criar tabela specialists
CREATE TABLE IF NOT EXISTS specialists (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para specialists
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;

-- Criar tabela admins
CREATE TABLE IF NOT EXISTS admins (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Tipos ENUM para service_orders
CREATE TYPE IF NOT EXISTS service_order_status AS ENUM (
    'pending',
    'in_progress', 
    'completed',
    'cancelled'
);

-- Criar tabela service_orders
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID NOT NULL REFERENCES clients(profile_id),
    partner_id UUID REFERENCES partners(profile_id),
    specialist_id UUID REFERENCES specialists(profile_id),
    status service_order_status DEFAULT 'pending',
    description TEXT,
    estimated_value NUMERIC(10, 2),
    final_value NUMERIC(10, 2),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para service_orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Supabase Migration: Add Evaluations, Parts, and Service Order Logs Tables

-- Tabela de Avaliações de Especialistas
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  service_order_id UUID NOT NULL REFERENCES service_orders(id),
  specialist_id UUID NOT NULL REFERENCES specialists(profile_id),
  evaluation_date timestamptz DEFAULT now() NOT NULL,
  description text,
  recommendations jsonb, -- Array de serviços/peças recomendados
  photos jsonb -- Array de URLs de fotos da avaliação no Supabase Storage
);

-- Tabela de Peças
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  description text,
  unit_price numeric,
  sku varchar UNIQUE
);

-- Tabela de Histórico de Status da Ordem de Serviço
CREATE TABLE IF NOT EXISTS service_order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  service_order_id UUID NOT NULL REFERENCES service_orders(id),
  old_status service_order_status,
  new_status service_order_status NOT NULL,
  changed_by_profile_id UUID REFERENCES profiles(id),
  notes text
);

-- Políticas de RLS para as novas tabelas
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permissivas para admins)
-- Função para verificar role
CREATE OR REPLACE FUNCTION get_my_claim(claim_name text)
RETURNS text AS $$
BEGIN
  RETURN coalesce(
    current_setting('request.jwt.claims', true)::json ->> claim_name,
    current_setting('request.jwt.claim.' || claim_name, true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (true);

-- Políticas para admins (bypass RLS via service role)
CREATE POLICY "Service role bypass" ON profiles
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON clients
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON partners
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON specialists
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON admins
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON service_orders
    FOR ALL USING (current_setting('role') = 'service_role');

-- Avaliações: Admins e especialistas podem gerenciar
CREATE POLICY "Staff can manage evaluations" ON evaluations
  FOR ALL USING (get_my_claim('role') IN ('admin', 'specialist'))
  WITH CHECK (get_my_claim('role') IN ('admin', 'specialist'));

-- Peças: Admins podem gerenciar, especialistas podem ver
CREATE POLICY "Admins can manage parts" ON parts
  FOR ALL USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Specialists can view parts" ON parts
  FOR SELECT USING (get_my_claim('role') = 'specialist');

-- Histórico de Status: Admins e especialistas podem ver
CREATE POLICY "Staff can view service_order_logs" ON service_order_logs
  FOR SELECT USING (get_my_claim('role') IN ('admin', 'specialist'));

-- Service role bypass para as novas tabelas
CREATE POLICY "Service role bypass" ON evaluations
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON parts
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass" ON service_order_logs
    FOR ALL USING (current_setting('role') = 'service_role');
