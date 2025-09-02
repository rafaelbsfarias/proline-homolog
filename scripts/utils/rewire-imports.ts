import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// Ajuste os mapeamentos aqui
const MAP: Record<string, string> = {
  'modules/partner/components/DadaPanel': 'modules/partner/components/DataTable',
};

const files = project.addSourceFilesAtPaths([
  'app/**/*.{ts,tsx,js,jsx}',
  'modules/**/*.{ts,tsx,js,jsx}',
]);

for (const sf of files) {
  for (const imp of sf.getImportDeclarations()) {
    const mod = imp.getModuleSpecifierValue();
    for (const [oldP, newP] of Object.entries(MAP)) {
      if (
        mod === oldP ||
        mod.endsWith(`${oldP}.ts`) ||
        mod.endsWith(`${oldP}.tsx`) ||
        mod.endsWith(`/${oldP}`) ||
        mod === `@/${oldP}`
      ) {
        imp.setModuleSpecifier(mod.replace(oldP, newP).replace(`@/${oldP}`, `@/${newP}`));
      }
    }
  }
}

project.save().then(() => console.log('Imports atualizados.'));
