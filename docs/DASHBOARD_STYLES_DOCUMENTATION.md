# Documentação de Estilos do Dashboard do Cliente

## Visão Geral
Esta documentação descreve todos os estilos CSS aplicados aos componentes do dashboard do cliente, organizados por arquivo e componente.

## 1. ClientDashboard.css - Estilos Principais do Dashboard

### Container Principal
```css
.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 0 0 0;
}
```

### Títulos e Textos
```css
.dashboard-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.dashboard-welcome {
  color: #666;
  font-size: 1.15rem;
  margin-bottom: 24px;
}
```

### Botões de Ação
```css
.dashboard-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-btn {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 6px;
  border: none;
  background: #002e4c;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(25, 119, 242, 0.08);
  cursor: pointer;
  transition: filter 0.2s;
}

.dashboard-btn:hover {
  filter: brightness(1.08);
}
```

### Contadores
```css
.dashboard-counter {
  margin-bottom: 24px;
}
```

## 2. VehicleCounter.css - Componente de Contagem de Veículos

### Container Principal
```css
.vehicle-counter {
  background: linear-gradient(135deg, #002e4c 100%, #002e4c 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.vehicle-counter:hover {
  transform: translateY(-2px);
}
```

### Estados Especiais
```css
.vehicle-counter.loading {
  background: linear-gradient(135deg, #002e4c 100%, #002e4c 100%);
}

.vehicle-counter.error {
  background: linear-gradient(135deg, #ee5a52 0%, #ee5a52 100%);
}
```

### Cabeçalho
```css
.counter-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.counter-content {
  flex: 1;
}

.counter-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  opacity: 0.9;
}

.counter-number {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
  margin: 5px 0;
}

.counter-content p {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
```

### Filtros
```css
.counter-filters {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.counter-filters input[type='text'],
.counter-filters select {
  background: rgba(33, 51, 63, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.9rem;
}
```

### Botões de Ação
```css
.counter-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.refresh-button,
.details-button,
.retry-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  padding: 8px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.refresh-button:hover,
.details-button:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### Detalhes dos Veículos
```css
.vehicles-details {
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;
}

.vehicles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### Cards de Veículo (Estilos Internos)
```css
.vehicle-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.vehicle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.vehicle-plate {
  font-weight: bold;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.vehicle-model {
  font-size: 0.95rem;
  opacity: 0.9;
}

.vehicle-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.7;
}

.vehicle-status {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 500;
}

.vehicle-status.ativo,
.vehicle-status.definir-opcao-de-coleta {
  background: rgba(76, 175, 80, 0.3);
  color: #c8e6c9;
}
```

### Controles de Coleta
```css
.collection-controls {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.vehicle-row-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 8px;
  margin-top: 8px;
}

.save-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}
```

### Botões de Aprovação/Rejeição
```css
.approve-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  margin-right: 8px;
}

.approve-button:hover {
  background-color: #45a049;
}

.reject-button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}

.reject-button:hover {
  background-color: #da190b;
}
```

### Responsividade
```css
@media (max-width: 768px) {
  .vehicle-counter {
    padding: 15px;
  }

  .counter-header {
    gap: 12px;
  }

  .counter-icon {
    font-size: 2rem;
  }

  .counter-number {
    font-size: 2rem;
  }

  .vehicle-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .vehicle-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
```

## 3. ContractAcceptanceScreen.module.css - Tela de Aceitação de Contrato

### Container
```css
.wrapper {
  min-height: 100vh;
  background: #f5f5f5;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 10px 0 0;
}
```

### Títulos
```css
.title {
  font-size: 2.4rem;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  font-size: 1.15rem;
  margin-bottom: 32px;
}
```

### Card do Contrato
```css
.centerRow {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

.card {
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  padding: 36px 32px 32px 32px;
  min-width: 600px;
  max-width: 900px;
  margin-bottom: 32px;
}

.sectionTitle {
  font-weight: 600;
  font-size: 1.3rem;
  margin-bottom: 18px;
}
```

### Conteúdo do Contrato
```css
.row {
  font-size: 1.08rem;
  color: #222;
  margin-bottom: 8px;
}

.muted {
  color: #888;
  font-size: 1.08rem;
  margin-top: 18px;
}
```

### Checkbox e Botão
```css
.checkboxRow {
  margin-top: 32px;
  display: flex;
  align-items: center;
  font-size: 1.08rem;
  color: #222;
}

.checkbox {
  margin-right: 8px;
}

.acceptButtonExtra {
  margin-top: 24px;
  color: #fff;
  font-weight: 600;
  font-size: 1.13rem;
}
```

## 4. StatusChips.css - Chips de Status

```css
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 0.85rem;
  cursor: pointer;
}

.status-chip__count {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  padding: 2px 6px;
  font-weight: 600;
  line-height: 1;
}
```

## 5. VehicleCounterActions.module.css - Ações do Contador

```css
.vehicle-counter-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.action-button {
  background: #002e4c;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(25, 119, 242, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button:hover:not(:disabled) {
  background: #06253c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 119, 242, 0.15);
}

.action-button:disabled {
  background: #aab0bb;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .vehicle-counter-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
```

## 6. VehicleCounterError.module.css - Estados de Erro

```css
.vehicle-counter-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #f5c6cb;
}

.error-icon {
  font-size: 2rem;
}

.error-content {
  flex: 1;
}

.error-title {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-message {
  margin: 0 0 16px 0;
  font-size: 1rem;
  line-height: 1.5;
}

.retry-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #c82333;
}
```

## 7. VehicleCounterHeader.module.css - Cabeçalho do Contador

```css
.vehicle-counter-header {
  background: linear-gradient(135deg, #002e4c 0%, #002e4c 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  margin-bottom: 24px;
}

.vehicle-counter-header:hover {
  transform: translateY(-2px);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.welcome {
  font-size: 1.15rem;
  margin: 0;
  color: #e8f1ff;
}

.counter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.counter-number {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

.counter-label {
  font-size: 1rem;
  opacity: 0.9;
}

.refresh-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  padding: 8px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .vehicle-counter-header {
    padding: 15px;
  }

  .title {
    font-size: 1.5rem;
  }

  .welcome {
    font-size: 1rem;
  }

  .counter-number {
    font-size: 2rem;
  }
}
```

## 8. VehicleCard.module.css - Cards Individuais de Veículo

```css
.vehicle-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.vehicle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #002e4c;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.vehicle-plate {
  font-size: 1.25rem;
  font-weight: 700;
  color: #002e4c;
  font-family: 'Courier New', monospace;
}

.vehicle-status {
  background: #e8f4f8;
  color: #002e4c;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vehicle-brand-model {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.vehicle-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #666;
}

@media (max-width: 768px) {
  .vehicle-details {
    flex-direction: column;
    gap: 4px;
  }
}
```

## Paleta de Cores Utilizada

### Cores Principais
- **Azul Principal**: `#002e4c` - Usado em botões, cabeçalhos e elementos principais
- **Azul Escuro**: `#06253c` - Hover states dos botões principais
- **Azul Claro**: `#e8f1ff` - Textos secundários em elementos azuis
- **Branco**: `#fff` - Fundo de cards e elementos claros
- **Cinza Claro**: `#f5f5f5` - Fundo da página
- **Cinza Médio**: `#666` - Textos secundários
- **Cinza Escuro**: `#333` - Textos principais

### Cores de Estado
- **Sucesso**: `#4caf50` (verde) - Botões de aprovação
- **Erro**: `#f44336` (vermelho) - Botões de rejeição e estados de erro
- **Aviso**: `#ee5a52` (laranja/vermelho) - Estados de erro do contador

### Transparências
- **Elementos sobre fundo azul**: `rgba(255, 255, 255, 0.1)` a `rgba(255, 255, 255, 0.3)`
- **Bordas**: `rgba(255, 255, 255, 0.25)` para elementos sobre fundo azul
- **Sombras**: `rgba(25, 119, 242, 0.08)` para botões e cards

## Considerações de Design

1. **Consistência Visual**: Todos os componentes seguem o mesmo padrão de cores e espaçamentos
2. **Hierarquia Visual**: Tamanhos de fonte e pesos seguem uma hierarquia clara
3. **Interatividade**: Hover states e transições suaves em todos os elementos clicáveis
4. **Responsividade**: Breakpoints em 768px para dispositivos móveis
5. **Acessibilidade**: Contraste adequado entre texto e fundo, elementos focáveis
6. **Performance**: Transições CSS otimizadas com GPU acceleration

## Notas para Manutenção

- Manter a paleta de cores consistente em novos componentes
- Seguir os padrões de espaçamento (múltiplos de 4px)
- Utilizar as variáveis de transparência para consistência
- Testar responsividade em diferentes tamanhos de tela
- Verificar contraste de cores para acessibilidade
