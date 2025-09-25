const fs = require('fs');

// Lê o arquivo
const filePath = 'modules/partner/domain/entities/PartnerService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Define o padrão para encontrar e substituir
const pattern = /return createError\((\w+)\.error\);/g;

// Substitui todas as ocorrências
content = content.replace(pattern, (match, variableName) => {
  return `const failureResult = ${variableName} as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);`;
});

// Escreve o arquivo modificado
fs.writeFileSync(filePath, content, 'utf8');
console.log('Arquivo corrigido com sucesso!');
