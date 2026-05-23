import {expect, test} from 'bun:test'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import fs from 'fs-extra'
import {rolldown} from 'rolldown'

import bundilPlugin, {createBundilPlugins} from '../src/main.ts'

test('builds a minified library bundle with declarations and publication assets', async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), 'rolldown-plugin-bundil-'))
  await fs.mkdir(join(cwd, 'src'), {recursive: true})
  await Bun.write(join(cwd, 'package.json'), JSON.stringify({
    name: 'fixture-library',
    version: '1.0.0',
    type: 'module',
    description: 'fixture library',
    funding: 'https://example.com/funding',
    license: 'MIT',
  }, null, 2))
  await Bun.write(join(cwd, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'ESNext',
      target: 'ESNext',
    },
    include: ['src'],
  }, null, 2))
  await Bun.write(join(cwd, 'src/main.ts'), [
    'export const answer = () => {',
    '  return 42',
    '}',
  ].join('\n'))
  await Bun.write(join(cwd, 'license.txt'), 'MIT fixture license\n')
  await Bun.write(join(cwd, 'readme.md'), '# Fixture library\n')
  const bundle = await rolldown({
    cwd,
    plugins: [bundilPlugin()],
  })
  await bundle.write({})
  await bundle.close()
  const libraryJavaScript = await Bun.file(join(cwd, 'dist/lib.js')).text()
  const libraryTypeDeclarations = await Bun.file(join(cwd, 'dist/lib.d.ts')).text()
  const packageJson = await Bun.file(join(cwd, 'dist/package.json')).json() as Record<string, unknown>
  expect(libraryJavaScript).not.toContain('//#region')
  expect(libraryJavaScript).toMatch(/^const (\w)=\(\)=>42\s*export\{\1 as answer\}\s*$/)
  expect(libraryTypeDeclarations).toContain('declare const answer')
  expect(libraryTypeDeclarations).toContain('number')
  expect(await Bun.file(join(cwd, 'dist/LICENSE')).text()).toBe('MIT fixture license\n')
  expect(await Bun.file(join(cwd, 'dist/README.md')).text()).toBe('# Fixture library\n')
  expect(packageJson).toMatchObject({
    exports: {
      '.': {
        default: './lib.js',
        import: './lib.js',
        types: './lib.d.ts',
      },
    },
    funding: 'https://example.com/funding',
    name: 'fixture-library',
    type: 'module',
    types: './lib.d.ts',
    version: '1.0.0',
  })
  expect(createBundilPlugins().length).toBeGreaterThanOrEqual(6)
})
test('emits a vendor chunk when externals are bundled on the side', async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), 'rolldown-plugin-bundil-side-'))
  await fs.mkdir(join(cwd, 'src'), {recursive: true})
  await Bun.write(join(cwd, 'package.json'), JSON.stringify({
    name: 'fixture-library-side',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      optis: '^0.1.0',
    },
    license: 'MIT',
  }, null, 2))
  await Bun.write(join(cwd, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'ESNext',
      target: 'ESNext',
    },
    include: ['src'],
  }, null, 2))
  await Bun.write(join(cwd, 'src/main.ts'), [
    "import optis from 'optis'",
    'const schema = optis({defaults: {answer: 42}})',
    'export default schema.process().answer',
  ].join('\n'))
  const install = Bun.spawn(['bun', 'install'], {
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const installExitCode = await install.exited
  expect(installExitCode).toBe(0)
  const bundle = await rolldown({
    cwd,
    plugins: [bundilPlugin({externals: 'side'})],
  })
  await bundle.write({})
  await bundle.close()
  expect(await Bun.file(join(cwd, 'dist/lib.js')).exists()).toBe(true)
  expect(await Bun.file(join(cwd, 'dist/vendor.js')).exists()).toBe(true)
  const packageJson = await Bun.file(join(cwd, 'dist/package.json')).json() as Record<string, unknown>
  expect(packageJson).not.toHaveProperty('dependencies')
})
