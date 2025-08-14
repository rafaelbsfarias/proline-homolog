
-- 1. Cria a tabela de junção para vincular Clientes e Especialistas
CREATE TABLE IF NOT EXISTS public.client_specialists (
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (client_id, specialist_id)
);

-- 2. Adiciona comentários para clareza
COMMENT ON TABLE public.client_specialists IS 'Tabela de junção para associar especialistas a clientes.';
COMMENT ON COLUMN public.client_specialists.client_id IS 'FK para o perfil do cliente.';
COMMENT ON COLUMN public.client_specialists.specialist_id IS 'FK para o perfil do especialista.';

-- 3. Habilita Row Level Security (RLS) na tabela
ALTER TABLE public.client_specialists ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas, se existirem, para evitar conflitos
DROP POLICY IF EXISTS "Admins podem gerenciar todas as associações" ON public.client_specialists;
DROP POLICY IF EXISTS "Especialistas podem ver seus próprios clientes associados" ON public.client_specialists;

-- 4. Cria políticas de segurança (RLS)

-- Política para Administradores: Admins podem fazer tudo (select, insert, update, delete)
CREATE POLICY "Admins podem gerenciar todas as associações" 
ON public.client_specialists
FOR ALL
USING (
  (get_my_claim('user_role'))::text = 'admin'
);

-- Política para Especialistas: Especialistas podem ver os clientes aos quais estão associados
CREATE POLICY "Especialistas podem ver seus próprios clientes associados"
ON public.client_specialists
FOR SELECT
USING (
  auth.uid() = specialist_id
);
