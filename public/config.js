System.config({
  transpiler: 'typescript',
  typescriptOptions: {
    emitDecoratorMetadata: true
  },
  map: {
    typescript: 'node_modules/typescript/lib/typescript.js'
  },
  paths: {
    app: 'app'
  },
  packages: {
    app: {
      main: 'boot.ts',
      defaultExtension: 'ts'
    }
  }
});
