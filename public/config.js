System.config({
  transpiler: 'typescript',
  typescriptOptions: {
    emitDecoratorMetadata: true
  },
  map: {
    typescript: 'typescript.js'
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
