import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const createConfig = (input, outputName) => ({
  input,
  output: [
    {
      file: `dist/${outputName}.cjs`,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: `dist/${outputName}.esm.js`,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: outputName === 'index',
      declarationDir: outputName === 'index' ? 'dist' : undefined,
      declarationMap: outputName === 'index',
    }),
    postcss({
      extract: false,
      inject: true,
    }),
  ],
  external: [
    'react',
    'react-dom',
    'next',
    'stripe',
    '@radix-ui/react-slider',
    '@radix-ui/react-progress',
    '@radix-ui/react-tabs',
    '@radix-ui/react-label',
    'lucide-react',
    'zod',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ],
});

export default [
  createConfig('src/index.ts', 'index'),
  createConfig('src/server.ts', 'server'),
]; 