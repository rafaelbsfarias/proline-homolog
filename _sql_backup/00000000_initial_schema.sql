-- Migração inicial: Criar estrutura básica do banco
-- Este arquivo deve ser executado primeiro, antes de qualquer outra migração

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

-- Políticas básicas para profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (true);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Criar tabela pending_registrations para novos cadastros
CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    cnpj TEXT,
    company_name TEXT,
    address TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('client', 'partner', 'specialist')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para pending_registrations
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (usado pelas APIs admin)
CREATE POLICY "Service role full access profiles" ON profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access clients" ON clients
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access partners" ON partners
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access specialists" ON specialists
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access admins" ON admins
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access pending_registrations" ON pending_registrations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Criar um usuário admin padrão para testes
INSERT INTO profiles (id, email, full_name, role, email_confirmed) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@prolineauto.com.br', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO admins (profile_id) VALUES 
    ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (profile_id) DO NOTHING;

-- Comentário
COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE clients IS 'Dados específicos de clientes';
COMMENT ON TABLE partners IS 'Dados específicos de parceiros';
COMMENT ON TABLE specialists IS 'Dados específicos de especialistas';
COMMENT ON TABLE admins IS 'Dados específicos de administradores';
COMMENT ON TABLE pending_registrations IS 'Cadastros pendentes de aprovação';
