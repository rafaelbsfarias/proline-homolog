/**
 * Script temporário para corrigir tipos Result em arquivos TypeScript
 * Este script corrige o uso de tipos Result em uniões discriminadas
 * onde o TypeScript não consegue inferir que .error está disponível
 * quando success === false
 */

const fs = require('fs');
const path = require('path');

function fixResultTypes(filePath) {
  console.log(`Corrigindo tipos Result em: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Padrão 1: return createError(variable.error);
    const pattern1 = /return createError\((\w+)\.error\);/g;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, (match, variableName) => {
        hasChanges = true;
        return `const failureResult = ${variableName} as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);`;
      });
    }

    // Padrão 2: result.error?.property
    const pattern2 = /(\w+)\.error\?\.(name|message)/g;
    if (pattern2.test(content)) {
      content = content.replace(pattern2, (match, variableName, property) => {
        hasChanges = true;
        return `(${variableName} as { readonly success: false; readonly error: Error }).error?.${property}`;
      });
    }

    // Padrão 3: Tratamento em handleServiceResult
    const pattern3 = /const errorName = result\.error\?\.(name|message)/g;
    if (pattern3.test(content)) {
      content = content.replace(pattern3, (match, property) => {
        hasChanges = true;
        return `const failureResult = result as { readonly success: false; readonly error: Error };
  const errorName = failureResult.error?.${property}`;
      });
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Arquivo ${filePath} corrigido com sucesso!`);
    } else {
      console.log(`ℹ️  Nenhuma correção necessária em ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'modules/partner/domain/entities/PartnerService.ts',
  'app/api/partner/services/v2/error-handler.ts',
  'app/api/partner/services/v2/lib/error-handler.ts',
  'app/api/partner/services/v2/[serviceId]/route.ts'
];

console.log('🔧 Iniciando correção de tipos Result...\n');

filesToFix.forEach(fixResultTypes);

console.log('\n✨ Correção de tipos Result finalizada!');
