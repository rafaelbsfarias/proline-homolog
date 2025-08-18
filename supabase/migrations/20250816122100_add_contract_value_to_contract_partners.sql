-- Add contract_value to contract_partners to store agreed value at registration

ALTER TABLE public.contract_partners
ADD COLUMN IF NOT EXISTS contract_value numeric(12,2);

COMMENT ON COLUMN public.contract_partners.contract_value IS 'Valor de contrato acordado no momento do cadastro (BRL)';

