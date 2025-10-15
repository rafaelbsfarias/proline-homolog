-- =====================================================
-- AUDIT: RELAÇÕES DO CHECKLIST (AS-IS)
-- Foco: mechanics_checklist, mechanics_checklist_items, mechanics_checklist_evidences
-- e relação com quotes, vehicles e partners
-- Uso: psql $DB_URL -f scripts/checklist/audit-checklist-relations.sql
-- =====================================================
\echo '=========================================='
\echo '🔍 AUDITORIA: Relações do Checklist'
\echo '=========================================='
\echo ''

-- 0. Contexto (contagens gerais)
\echo '=== 0. Visão Geral ==='
SELECT 
  (SELECT COUNT(*) FROM mechanics_checklist) AS total_checklists,
  (SELECT COUNT(*) FROM mechanics_checklist_items) AS total_items,
  (SELECT COUNT(*) FROM mechanics_checklist_evidences) AS total_evidences;

\echo ''
\echo '=== 1. Duplicidades por quote_id/partner_id na tabela principal ==='
SELECT quote_id, partner_id, COUNT(*) AS count
FROM mechanics_checklist
GROUP BY quote_id, partner_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

\echo ''
\echo '=== 2. Items órfãos: sem checklist correspondente (por quote/partner) ==='
SELECT i.quote_id, i.partner_id, COUNT(*) AS items_sem_checklist
FROM mechanics_checklist_items i
LEFT JOIN mechanics_checklist c
  ON c.quote_id = i.quote_id AND c.partner_id = i.partner_id
WHERE c.id IS NULL
GROUP BY i.quote_id, i.partner_id
ORDER BY items_sem_checklist DESC
LIMIT 50;

\echo ''
\echo '=== 3. Evidences órfãs: sem checklist correspondente (por quote/partner) ==='
SELECT e.quote_id, e.partner_id, COUNT(*) AS evidences_sem_checklist
FROM mechanics_checklist_evidences e
LEFT JOIN mechanics_checklist c
  ON c.quote_id = e.quote_id AND c.partner_id = e.partner_id
WHERE c.id IS NULL
GROUP BY e.quote_id, e.partner_id
ORDER BY evidences_sem_checklist DESC
LIMIT 50;

\echo ''
\echo '=== 4. Items órfãos: sem correspondência em quotes ==='
SELECT i.quote_id, COUNT(*) AS total
FROM mechanics_checklist_items i
LEFT JOIN quotes q ON q.id = i.quote_id
WHERE i.quote_id IS NOT NULL AND q.id IS NULL
GROUP BY i.quote_id
ORDER BY total DESC
LIMIT 50;

\echo ''
\echo '=== 5. Evidences órfãs: sem correspondência em quotes ==='
SELECT e.quote_id, COUNT(*) AS total
FROM mechanics_checklist_evidences e
LEFT JOIN quotes q ON q.id = e.quote_id
WHERE e.quote_id IS NOT NULL AND q.id IS NULL
GROUP BY e.quote_id
ORDER BY total DESC
LIMIT 50;

\echo ''
\echo '=== 6. Uso misto de inspection_id vs quote_id (potencial inconsistência) ==='
SELECT 
  SUM(CASE WHEN quote_id IS NULL AND inspection_id IS NOT NULL THEN 1 ELSE 0 END) AS so_inspection_only,
  SUM(CASE WHEN quote_id IS NOT NULL AND inspection_id IS NULL THEN 1 ELSE 0 END) AS so_quote_only,
  SUM(CASE WHEN quote_id IS NOT NULL AND inspection_id IS NOT NULL THEN 1 ELSE 0 END) AS both,
  SUM(CASE WHEN quote_id IS NULL AND inspection_id IS NULL THEN 1 ELSE 0 END) AS none
FROM mechanics_checklist_items;

\echo ''
\echo '=== 7. Duplicidades de items por quote/partner/item_key ==='
SELECT quote_id, partner_id, item_key, COUNT(*) AS duplicados
FROM mechanics_checklist_items
GROUP BY quote_id, partner_id, item_key
HAVING COUNT(*) > 1
ORDER BY duplicados DESC, quote_id
LIMIT 100;

\echo ''
\echo '=== 8. Existence check: evidencia para item inexistente (mesma quote/partner/item_key) ==='
SELECT e.quote_id, e.partner_id, e.item_key, COUNT(*) AS evid_count
FROM mechanics_checklist_evidences e
LEFT JOIN mechanics_checklist_items i
  ON i.quote_id = e.quote_id AND i.partner_id = e.partner_id AND i.item_key = e.item_key
WHERE i.id IS NULL
GROUP BY e.quote_id, e.partner_id, e.item_key
ORDER BY evid_count DESC
LIMIT 100;

\echo ''
\echo '=== 9. Evidências por item (itens com muitas evidências) ==='
SELECT quote_id, partner_id, item_key, COUNT(*) AS evidences
FROM mechanics_checklist_evidences
GROUP BY quote_id, partner_id, item_key
HAVING COUNT(*) > 3
ORDER BY evidences DESC
LIMIT 50;

\echo ''
\echo '=== 10. Itens sem evidência (NOK/ATT) no último checklist por quote ==='
-- Observação: depende da semântica de status; aqui é indicativo
WITH latest_checklist AS (
  SELECT DISTINCT ON (quote_id, partner_id)
    id, quote_id, partner_id, status, updated_at
  FROM mechanics_checklist
  ORDER BY quote_id, partner_id, updated_at DESC NULLS LAST
)
SELECT i.quote_id, i.partner_id, i.item_key, i.item_status
FROM mechanics_checklist_items i
JOIN latest_checklist lc ON lc.quote_id = i.quote_id AND lc.partner_id = i.partner_id
LEFT JOIN mechanics_checklist_evidences e
  ON e.quote_id = i.quote_id AND e.partner_id = i.partner_id AND e.item_key = i.item_key
WHERE i.item_status IN ('NOK','ATT')
GROUP BY i.quote_id, i.partner_id, i.item_key, i.item_status
HAVING COUNT(e.id) = 0
ORDER BY i.quote_id, i.item_key
LIMIT 100;

\echo ''
\echo '=========================================='
\echo '✅ Auditoria de relações do checklist concluída'
\echo '=========================================='

