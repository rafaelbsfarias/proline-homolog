-- Criação da tabela vehicles (veículos)
-- Esta tabela armazena informações dos veículos associados aos clientes

CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informações básicas do veículo
  plate VARCHAR(10) NOT NULL UNIQUE, -- Placa (formato brasileiro)
  brand VARCHAR(100) NOT NULL, -- Marca (ex: Toyota, Volkswagen)
  model VARCHAR(100) NOT NULL, -- Modelo (ex: Corolla, Golf)
  color VARCHAR(50) NOT NULL, -- Cor
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1), -- Ano
  
  -- Informações financeiras e logísticas
  fipe_value DECIMAL(12,2), -- Valor FIPE em reais
  estimated_arrival_date DATE, -- Data prevista de chegada
  
  -- Metadados
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id), -- Admin que cadastrou
  
  -- Índices para performance
  CONSTRAINT vehicles_plate_format CHECK (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$')
);

-- Índices para otimização de consultas
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicles_updated_at();

-- RLS (Row Level Security) para garantir que usuários só vejam seus próprios veículos
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Política para clientes verem apenas seus próprios veículos
CREATE POLICY "Users can view their own vehicles" ON vehicles
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'specialist'
    );

-- Política para inserção (apenas admins podem inserir)
CREATE POLICY "Only admins can insert vehicles" ON vehicles
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política para atualização (apenas admins podem atualizar)
CREATE POLICY "Only admins can update vehicles" ON vehicles
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política para exclusão (apenas admins podem excluir)
CREATE POLICY "Only admins can delete vehicles" ON vehicles
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Comentários para documentação
COMMENT ON TABLE vehicles IS 'Tabela para armazenar informações dos veículos dos clientes';
COMMENT ON COLUMN vehicles.plate IS 'Placa do veículo no formato brasileiro (ABC1234 ou ABC1D23)';
COMMENT ON COLUMN vehicles.fipe_value IS 'Valor FIPE do veículo em reais';
COMMENT ON COLUMN vehicles.estimated_arrival_date IS 'Data prevista de chegada do veículo';
COMMENT ON COLUMN vehicles.status IS 'Status do veículo: active, inactive, sold';
