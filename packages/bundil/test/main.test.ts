import {describe, expect, test} from 'bun:test'

import Bundil, {createBundilConfig, createBundilInputOptions, createBundilOutputOptions, toEntryExport, toPluginOptionsArray} from '../src/main.ts'

describe('Bundil', () => {
  test('creates sensible default input and output options', () => {
    const bundil = new Bundil
    expect(bundil.outputFolder).toBe('dist')
    expect(bundil.externals).toBe('dependencies')
    expect(createBundilInputOptions()).toMatchObject({
      input: 'src/main.ts',
    })
    const outputOptions = createBundilOutputOptions()
    expect(outputOptions).toMatchObject({
      assetFileNames: '[name][extname]',
      chunkFileNames: '[name].js',
      dir: 'dist',
      format: 'es',
    })
    expect(outputOptions.entryFileNames).toBeFunction()
    expect((outputOptions.entryFileNames as (chunk: {name: string}) => string)({name: 'main'})).toBe('lib.js')
    expect((outputOptions.entryFileNames as (chunk: {name: string}) => string)({name: 'main.d'})).toBe('lib.d.js')
    const config = createBundilConfig()
    expect(config).toMatchObject({
      input: 'src/main.ts',
      output: {
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
        dir: 'dist',
        format: 'es',
      },
    })
    expect(config.output && !Array.isArray(config.output) && config.output.entryFileNames).toBeFunction()
    expect(Bundil).toBeTypeOf('function')
  })
  test('processes constructor options and ignores unknown fields', () => {
    const bundil = new Bundil({
      externals: 'merged',
      output: 'out/',
      unknown: 'ignored',
    } as never)
    expect(bundil.options).toEqual({
      externals: 'merged',
      output: 'out',
    })
    expect(bundil.getPublishimoExcludeFields()).toEqual(['dependencies', 'optionalDependencies'])
  })
  test('replaces output.file with directory-based library defaults', () => {
    const outputOptions = createBundilOutputOptions({file: 'dist/main.js'})
    expect(outputOptions).toMatchObject({
      assetFileNames: '[name][extname]',
      chunkFileNames: '[name].js',
      dir: 'dist',
      format: 'es',
    })
    expect(outputOptions).not.toHaveProperty('file')
    expect(outputOptions.entryFileNames).toBeFunction()
  })
  test('creates side-mode vendor chunk settings', () => {
    const outputOptions = createBundilOutputOptions({}, {externals: 'side'})
    expect(outputOptions).toMatchObject({
      assetFileNames: '[name][extname]',
      dir: 'dist',
      format: 'es',
    })
    expect(outputOptions.chunkFileNames).toBeFunction()
    // eslint-disable-next-line typescript/no-deprecated
    expect(outputOptions.manualChunks).toBeFunction()
  })
  test('builds export conditions from output format', () => {
    expect(toEntryExport({scriptEntryFileName: 'lib.js'}, 'es')).toEqual({
      default: './lib.js',
      import: './lib.js',
    })
    expect(toEntryExport({scriptEntryFileName: 'lib.cjs'}, 'cjs')).toEqual({
      default: './lib.cjs',
      require: './lib.cjs',
    })
  })
  test('normalizes plugin options into arrays', () => {
    expect(toPluginOptionsArray()).toEqual([])
    expect(toPluginOptionsArray(false)).toEqual([])
    expect(toPluginOptionsArray('plugin')).toEqual(['plugin'])
    expect(toPluginOptionsArray(['plugin'])).toEqual(['plugin'])
  })
})
