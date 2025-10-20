# Lightbox para Evidências da Análise Preliminar

## Descrição
Implementação de lightbox para visualização de imagens em tamanho completo nas evidências da análise preliminar na página de detalhes do veículo.

## Data
19 de Outubro de 2025

## Componentes Modificados

### 1. `MediaCard.tsx`
**Localização:** `/modules/vehicles/components/cards/MediaCard.tsx`

**Mudanças:**
- Adicionada prop `onClick?: () => void` para tornar o card clicável
- Adicionado suporte para acessibilidade com `role="button"`, `tabIndex` e `onKeyDown`
- Adicionada classe CSS condicional `clickable` quando `onClick` está presente

**Funcionalidades:**
- Clique no card abre o lightbox
- Navegação por teclado: Enter ou Espaço abrem o lightbox
- Feedback visual de hover mais pronunciado quando clicável

### 2. `MediaCard.module.css`
**Localização:** `/modules/vehicles/components/cards/MediaCard.module.css`

**Mudanças:**
- Adicionada classe `.clickable` com `cursor: pointer`
- Efeito hover aprimorado para cards clicáveis (scale + shadow)
- Efeito active para feedback ao clicar

### 3. `VehicleMediaSection.tsx`
**Localização:** `/modules/vehicles/components/sections/VehicleMediaSection.tsx`

**Mudanças:**
- Adicionado `'use client'` para comportamento client-side
- Importação dinâmica do componente `Lightbox` para otimizar bundle
- Adicionado state management para controlar lightbox (aberto/fechado e índice atual)
- Implementadas funções `openLightbox`, `closeLightbox`, `nextImage`, `prevImage`
- Passada prop `onClick` para cada `MediaCard` com índice correto
- Renderização condicional do `Lightbox` quando aberto

## Componente Reutilizado

### `Lightbox.tsx`
**Localização:** `/modules/common/components/Lightbox/Lightbox.tsx`

Componente já existente que fornece:
- Visualização de imagem em tela cheia
- Navegação entre múltiplas imagens (setas laterais)
- Navegação por teclado (← → para navegar, Esc para fechar)
- Overlay escuro com backdrop
- Botão de fechar (×)
- Contador de imagens (X / Total)

## Fluxo de Uso

1. Usuário visualiza a seção "Evidências da Análise Preliminar"
2. Usuário clica em qualquer imagem da grid
3. Lightbox abre em tela cheia mostrando a imagem em qualidade máxima
4. Usuário pode:
   - Navegar entre imagens usando setas laterais
   - Navegar usando teclas ← e →
   - Fechar com botão × ou tecla Esc
   - Clicar fora da imagem para fechar

## Benefícios

### UX
- ✅ Melhor visualização das evidências em alta resolução
- ✅ Navegação fluida entre múltiplas evidências
- ✅ Acessibilidade com suporte a teclado
- ✅ Feedback visual claro de interatividade

### Técnico
- ✅ Reutilização de componente existente (DRY)
- ✅ Import dinâmico otimiza bundle size
- ✅ Componente client-side apenas onde necessário
- ✅ Sem bibliotecas externas adicionais

## Acessibilidade

- ✅ Role="button" para screen readers
- ✅ TabIndex permite navegação por teclado
- ✅ OnKeyDown suporta Enter e Espaço
- ✅ Aria-labels nos botões do lightbox
- ✅ Navegação por teclado (Esc, ←, →)

## Performance

- ✅ Lightbox carregado apenas no client-side (dynamic import)
- ✅ Lazy loading do componente Lightbox (carrega só quando necessário)
- ✅ Sem re-renders desnecessários
- ✅ Estado local isolado no componente

## Compatibilidade

- ✅ Desktop: Totalmente funcional com mouse e teclado
- ✅ Mobile: Touch-friendly, gestos de swipe (se suportado pelo Lightbox)
- ✅ Tablet: Funciona em ambos os modos
- ✅ Navegadores modernos: Chrome, Firefox, Safari, Edge

## Testes Recomendados

1. ✅ Clicar em imagem abre lightbox
2. ✅ Navegar entre imagens com setas
3. ✅ Navegar entre imagens com teclado (← →)
4. ✅ Fechar com botão ×
5. ✅ Fechar com tecla Esc
6. ✅ Fechar clicando no backdrop
7. ✅ Verificar acessibilidade com screen reader
8. ✅ Testar em mobile/tablet
9. ✅ Verificar qualidade de imagem em tela cheia
10. ✅ Testar com uma única imagem (sem setas de navegação)

## Próximas Melhorias (Opcional)

- [ ] Adicionar zoom in/out nas imagens
- [ ] Suporte a gestos de swipe em mobile
- [ ] Loading state enquanto imagem carrega
- [ ] Download de imagem em alta resolução
- [ ] Compartilhamento de imagem específica
