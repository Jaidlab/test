import {expect, test} from 'bun:test'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import fs from 'fs-extra'
import {rolldown} from 'rolldown'
import {dts} from 'rolldown-plugin-dts'

import publishimoPlugin from '../src/main.ts'

test('emits a publish-ready package.json with exports and types', async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), 'rolldown-plugin-publishimo-'))
  await fs.mkdir(join(cwd, 'src'), {recursive: true})
  await Bun.write(join(cwd, 'package.json'), JSON.stringify({
    name: 'fixture-package',
    version: '1.2.3',
    type: 'module',
    description: 'fixture package',
    funding: 'https://example.com/funding',
    peerDependencies: {
      react: '^19.0.0',
    },
    peerDependenciesMeta: {
      react: {
        optional: true,
      },
    },
    sideEffects: false,
  }, null, 2))
  await Bun.write(join(cwd, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'ESNext',
      target: 'ESNext',
    },
    include: ['src'],
  }, null, 2))
  await Bun.write(join(cwd, 'src/main.ts'), 'export const answer = () => 42\n')
  const bundle = await rolldown({
    cwd,
    input: 'src/main.ts',
    plugins: [
      ...dts(),
      publishimoPlugin(),
    ],
  })
  await bundle.write({
    dir: join(cwd, 'dist'),
    format: 'es',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
  })
  await bundle.close()
  const packageJson = await Bun.file(join(cwd, 'dist/package.json')).json() as Record<string, unknown>
  expect(packageJson).toMatchObject({
    description: 'fixture package',
    exports: {
      '.': {
        default: './main.js',
        import: './main.js',
        types: './main.d.ts',
      },
    },
    funding: 'https://example.com/funding',
    name: 'fixture-package',
    peerDependencies: {
      react: '^19.0.0',
    },
    peerDependenciesMeta: {
      react: {
        optional: true,
      },
    },
    sideEffects: false,
    type: 'module',
    types: './main.d.ts',
    version: '1.2.3',
  })
  expect(packageJson).not.toHaveProperty('devDependencies')
})
