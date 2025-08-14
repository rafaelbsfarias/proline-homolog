# Tela de Termos do Contrato - Cliente

## Visão Geral
A tela de termos do contrato é exibida na primeira vez que o cliente faz login no dashboard. Ela apresenta os detalhes do serviço personalizados baseados nos dados do perfil do cliente.

## Funcionalidades

### 1. Carregamento de Dados Dinâmicos
Os valores são buscados da tabela `profiles` com os seguintes campos:
- `parqueamento`: Valor do parqueamento (decimal)
- `quilometragem`: Quilometragem do veículo (integer)
- `percentual_fipe`: Percentual FIPE (decimal)
- `taxa_operacao`: Taxa de operação (decimal)

### 2. Fluxo de Aceitação
1. Cliente visualiza os termos personalizados
2. Marca o checkbox "Li e concordo com os termos"
3. Clica em "Aceitar Contrato"
4. Registro é salvo na tabela `client_contract_acceptance`
5. Cliente é redirecionado para o dashboard principal

### 3. Estrutura de Dados

#### Tabela `profiles`
```sql
ALTER TABLE profiles 
ADD COLUMN parqueamento DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN quilometragem INTEGER DEFAULT 0,
ADD COLUMN percentual_fipe DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN taxa_operacao DECIMAL(10,2) DEFAULT 0.00;
```

#### Tabela `client_contract_acceptance`
```sql
CREATE TABLE IF NOT EXISTS client_contract_acceptance (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Estados da Interface

#### Carregando
- Exibe "Carregando..." enquanto busca dados

#### Erro
- Exibe mensagem de erro se não conseguir carregar o perfil

#### Termos não Aceitos
- Mostra tela completa com termos do contrato
- Valores dinâmicos do perfil do cliente
- Checkbox para aceitar termos
- Botão de aceitar (habilitado apenas se checkbox marcado)

#### Termos Aceitos
- Dashboard principal do cliente
- Mensagem de boas-vindas personalizada

### 5. Formatação de Dados

#### Valores Monetários
- Formato: `R$ X.XX`
- Função: `toFixed(2)`

#### Quilometragem
- Formato: `X.XXX km`
- Função: `toLocaleString()`

#### Percentuais
- Formato: `X.XX%`
- Função: `toFixed(2)`

### 6. Tratamento de Erros

#### Dados Não Encontrados
- Fallback para valores padrão (0.00, 0, etc.)
- Não impede o funcionamento da aplicação

#### Falha na Conexão
- Mensagem de erro amigável
- Sugestão para recarregar a página

### 7. Como Configurar Dados de Teste

Para testar a funcionalidade, execute:

```sql
UPDATE profiles SET 
  parqueamento = 25.50,
  quilometragem = 75000,
  percentual_fipe = 7.25,
  taxa_operacao = 450.00
WHERE role = 'client' AND email = 'cliente@exemplo.com';
```

### 8. Melhorias Futuras

- [ ] Validação de campos obrigatórios
- [ ] Histórico de versões de contratos
- [ ] Assinatura digital
- [ ] Download de PDF do contrato
- [ ] Notificações de alterações nos termos
