import {expect, test} from 'bun:test'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import fs from 'fs-extra'
import {rolldown} from 'rolldown'

import bundilPlugin from '../src/main.ts'

type FixtureCase = {
  expectDependenciesField: boolean
  expectVendorChunk: boolean
  externals: 'dependencies' | 'merged' | 'side'
  input?: string
  repo: string
}

const cases: Array<FixtureCase> = [
  {
    repo: 'common-user-agent',
    externals: 'merged',
    expectVendorChunk: false,
    expectDependenciesField: false,
  },
  {
    repo: 'optis',
    externals: 'merged',
    expectVendorChunk: false,
    expectDependenciesField: false,
  },
  {
    repo: 'flatten-string',
    externals: 'merged',
    expectVendorChunk: false,
    expectDependenciesField: false,
  },
  {
    repo: 'compose-id',
    input: 'src/main.desktop.ts',
    externals: 'side',
    expectVendorChunk: true,
    expectDependenciesField: false,
  },
  {
    repo: 'vite-plugin-title',
    externals: 'dependencies',
    expectVendorChunk: false,
    expectDependenciesField: false,
  },
]
const buildRepo = async ({externals, input, repo}: FixtureCase) => {
  const cwd = `C:/Users/jaid/git/${repo}`
  const temporaryRoot = await fs.mkdtemp(join(tmpdir(), `bundil-${repo}-`))
  const output = join(temporaryRoot, 'dist')
  const bundle = await rolldown({
    cwd,
    ...input ? {input} : {},
    plugins: [
      bundilPlugin({
        externals,
        output,
      }),
    ],
  })
  await bundle.write({})
  await bundle.close()
  return {
    cwd,
    output,
  }
}
for (const fixture of cases) {
  test(`bundles ${fixture.repo} with externals=${fixture.externals}`, async () => {
    const {cwd, output} = await buildRepo(fixture)
    expect(await Bun.file(join(output, 'lib.js')).exists()).toBe(true)
    expect(await Bun.file(join(output, 'lib.d.ts')).exists()).toBe(true)
    expect(await Bun.file(join(output, 'package.json')).exists()).toBe(true)
    if (fixture.expectVendorChunk) {
      expect(await Bun.file(join(output, 'vendor.js')).exists()).toBe(true)
    } else {
      expect(await Bun.file(join(output, 'vendor.js')).exists()).toBe(false)
    }
    const packageJson = await Bun.file(join(output, 'package.json')).json() as Record<string, unknown>
    if (fixture.expectDependenciesField) {
      expect(packageJson).toHaveProperty('dependencies')
    } else {
      expect(packageJson).not.toHaveProperty('dependencies')
      expect(packageJson).not.toHaveProperty('optionalDependencies')
    }
    expect(packageJson).toMatchObject({
      exports: {
        '.': {
          default: './lib.js',
        },
      },
    })
    if (fixture.repo === 'common-user-agent') {
      const libraryJavaScript = await Bun.file(join(output, 'lib.js')).text()
      expect(libraryJavaScript).toContain('Chrome/148.0.0.0')
      expect(libraryJavaScript).not.toContain('versions.yml')
    }
    if (fixture.repo === 'vite-plugin-title') {
      const sourcePackageJson = await Bun.file(join(cwd, 'package.json')).json() as Record<string, unknown>
      expect(packageJson.peerDependencies).toEqual(sourcePackageJson.peerDependencies)
    }
  }, 120_000)
}
