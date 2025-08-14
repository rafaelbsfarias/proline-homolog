#!/usr/bin/env node

/* eslint-disable no-console */

// ========================================================================================
// SCRIPT PARA DETECTAR ARQUIVOS VAZIOS
// ========================================================================================
// Detecta e relata arquivos vazios ou com conteúdo mínimo
// ========================================================================================

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ========================================================================================
// CONFIGURAÇÕES
// ========================================================================================
const CONFIG = {
  extensions: ['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'json', 'md'],
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.git/**',
    '**/cypress/downloads/**',
    '**/cypress/screenshots/**',
    '**/cypress/videos/**',
    '**/.husky/**',
    '**/public/**/*.svg',
    '**/public/**/*.ico',
    '**/*.d.ts',
  ],
  minContentLength: 50, // Caracteres mínimos para não ser considerado "quase vazio"
};

// ========================================================================================
// FUNÇÕES UTILITÁRIAS
// ========================================================================================

/**
 * Verifica se o arquivo está completamente vazio
 */
function isCompletelyEmpty(content) {
  return content.trim().length === 0;
}

/**
 * Verifica se o arquivo contém apenas comentários
 */
function isOnlyComments(content, filePath) {
  const ext = path.extname(filePath);
  let withoutComments = content;

  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    // Remove comentários de linha
    withoutComments = withoutComments.replace(/\/\/.*$/gm, '');
    // Remove comentários de bloco
    withoutComments = withoutComments.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (['.css', '.scss'].includes(ext)) {
    // Remove comentários CSS
    withoutComments = withoutComments.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  return withoutComments.trim().length === 0;
}

/**
 * Verifica se o arquivo contém apenas imports/exports
 */
function isOnlyImportsExports(content) {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.every(
    line =>
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.includes('*/')
  );
}

/**
 * Verifica se o arquivo tem conteúdo mínimo
 */
function hasMinimalContent(content) {
  return content.trim().length < CONFIG.minContentLength;
}

// ========================================================================================
// FUNÇÃO PRINCIPAL
// ========================================================================================

async function findEmptyFiles() {
  console.log('🔍 Procurando por arquivos vazios...\n');

  const results = {
    completelyEmpty: [],
    onlyComments: [],
    onlyImportsExports: [],
    minimalContent: [],
  };

  try {
    // Criar padrões de busca para todas as extensões
    const patterns = CONFIG.extensions.map(ext => `**/*.${ext}`);

    // Buscar todos os arquivos
    const files = await glob(patterns, {
      ignore: CONFIG.ignorePatterns,
      nodir: true,
    });

    console.log(`📁 Analisando ${files.length} arquivos...\n`);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        if (isCompletelyEmpty(content)) {
          results.completelyEmpty.push(file);
        } else if (isOnlyComments(content, file)) {
          results.onlyComments.push(file);
        } else if (isOnlyImportsExports(content)) {
          results.onlyImportsExports.push(file);
        } else if (hasMinimalContent(content)) {
          results.minimalContent.push(file);
        }
      } catch (error) {
        console.log(`⚠️  Erro ao ler arquivo ${file}: ${error.message}`);
      }
    }

    // Relatório final
    console.log('📊 RELATÓRIO DE ARQUIVOS VAZIOS\n');
    console.log('===============================\n');

    if (results.completelyEmpty.length > 0) {
      console.log(`🔴 ARQUIVOS COMPLETAMENTE VAZIOS (${results.completelyEmpty.length}):`);
      results.completelyEmpty.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }

    if (results.onlyComments.length > 0) {
      console.log(`🟡 ARQUIVOS APENAS COM COMENTÁRIOS (${results.onlyComments.length}):`);
      results.onlyComments.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }

    if (results.onlyImportsExports.length > 0) {
      console.log(`🟠 ARQUIVOS APENAS COM IMPORTS/EXPORTS (${results.onlyImportsExports.length}):`);
      results.onlyImportsExports.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }

    if (results.minimalContent.length > 0) {
      console.log(`🟤 ARQUIVOS COM CONTEÚDO MÍNIMO (${results.minimalContent.length}):`);
      results.minimalContent.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }

    const totalEmpty = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    if (totalEmpty === 0) {
      console.log('✅ Nenhum arquivo vazio encontrado! 🎉');
    } else {
      console.log(`⚠️  Total de arquivos com problemas: ${totalEmpty}`);
      console.log('\n💡 Considere revisar ou remover estes arquivos para manter o código limpo.');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos:', error.message);
    process.exit(1);
  }
}

// ========================================================================================
// EXECUÇÃO
// ========================================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  findEmptyFiles();
}

export default findEmptyFiles;
