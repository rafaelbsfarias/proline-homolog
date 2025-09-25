const fs = require('fs');

// Lê o arquivo
const filePath = 'modules/partner/domain/entities/PartnerService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remove linhas duplicadas que começam com "const failureResult = failureResult"
content = content.replace(/\s*const failureResult = failureResult.*\n/g, '');

// Remove outras possíveis duplicações
content = content.replace(/(\s*const failureResult = \w+ as \{ readonly success: false; readonly error: Error \};\s*)\1+/g, '$1');

// Escreve o arquivo modificado
fs.writeFileSync(filePath, content, 'utf8');
console.log('Duplicações removidas com sucesso!');
