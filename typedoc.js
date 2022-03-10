module.exports = {
  includeVersion: true,
  tsconfig: './tsconfig-typedoc.json',
  entryPoints: ['./.typedoc/package/types/index.d.ts'],
  out: './static/api/v7',
  readme: 'none',
};
