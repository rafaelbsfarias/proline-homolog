import type { API, FileInfo, JSCodeshift } from 'jscodeshift';

export const parser = 'tsx'; // <- força TSX
export const parserConfig = {
  // ajuda com sintaxes modernas (se usar decorators/properties)
  plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy'],
};

// Ajuste este mapa para o que quer unificar:
const MAP: Record<string, string> = {
  'modules/partner/components/DadaPanel': 'modules/partner/components/DataTable',
  // EXEMPLOS (ajuste se precisar):
  // 'modules/common/components/EdgeFunctionEmailTest': 'modules/common/components/EmailTemplateTest',
  // 'modules/common/components/VehicleRegistrationModal': 'modules/common/components/ClientVehicleRegistrationModal',
};

export default function transform(file: FileInfo, api: API) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root.find(j.ImportDeclaration).forEach(path => {
    const from = String(path.value.source.value || '');
    for (const [oldPath, newPath] of Object.entries(MAP)) {
      const matches =
        from === oldPath ||
        from === `@/${oldPath}` ||
        from.endsWith(`${oldPath}.ts`) ||
        from.endsWith(`${oldPath}.tsx`) ||
        from.endsWith(`/${oldPath}`);

      if (matches) {
        path.value.source.value = from
          .replace(oldPath, newPath)
          .replace(`@/${oldPath}`, `@/${newPath}`);
        changed = true;
      }
    }
  });

  if (!changed) return null; // nada a alterar neste arquivo
  return root.toSource({ quote: 'single' });
}
