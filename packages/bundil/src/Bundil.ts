import type {ExternalOption, InputOptions, ModuleFormat, OutputBundle, OutputChunk, OutputOptions, Plugin, RolldownOptions} from 'rolldown'

import {builtinModules, createRequire, isBuiltin} from 'node:module'
import {dirname, join, relative, resolve} from 'node:path'

import fs from 'fs-extra'
import optis from 'optis'
import {parse as parseYaml} from 'yaml'

export type EntryExport = {
  default: string
  import?: string
  require?: string
  types?: string
}

export type RootPackageJson = {
  author?: unknown
  bin?: unknown
  bugs?: unknown
  dependencies?: Record<string, string>
  description?: string
  engines?: Record<string, string>
  exports?: Record<string, unknown>
  funding?: unknown
  homepage?: string
  keywords?: Array<string>
  license?: string
  name?: string
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, unknown>
  repository?: unknown
  sideEffects?: Array<string> | boolean
  type?: string
  version?: string
}

export type ExternalsMode = 'dependencies' | 'merged' | 'side'

type DistributionEntryFiles = {
  declarationEntryFileName?: string
  scriptEntryFileName: string
}

type CopyTextFilePluginOptions = {
  inputFileName: string
  outputFileName: string
  pluginName: string
}

type RuntimePackageState = {
  dependencyPackageNames: Array<string>
  dependencyPackageRoots: Array<string>
}

const defaultBundilOptions = {
  externals: 'dependencies' as ExternalsMode,
  output: 'dist',
}
const bundilOptionsSchema = optis({
  defaults: defaultBundilOptions,
  normalizations: {
    externals: (value: unknown): ExternalsMode => {
      if (value === 'dependencies' || value === 'merged' || value === 'side') {
        return value
      }
      throw new TypeError('Bundil option “externals” must be “dependencies”, “merged” or “side”.')
    },
    output: (value: unknown) => {
      const normalized = String(value).trim().replaceAll('\\', '/')
      if (!normalized) {
        return defaultBundilOptions.output
      }
      return normalized.replace(/\/+$/u, '') || normalized
    },
  },
})
const builtinImportNames = new Set([
  ...builtinModules,
  ...builtinModules.map(name => name.replace(/^node:/u, '')),
  ...builtinModules.map(name => {
    if (name.startsWith('node:')) {
      return name
    }
    return `node:${name}`
  }),
])
const isCommonJsFormat = (format: ModuleFormat | 'commonjs') => {
  return format === 'cjs' || format === 'commonjs'
}
const packageJsonDependencyFieldNames = ['dependencies', 'optionalDependencies'] as const
const declarationChunkFileNamePattern = /\.(?:d\.)?[cm]?ts$/u

export type BundilOptions = {
  merged: BundilProcessedOptions
  parameter: BundilOptionsParameter
}

type BundilOptionsParameter = {
  externals?: ExternalsMode
  output?: string
}

type BundilProcessedOptions = {
  externals: ExternalsMode
  output: string
}

const createYamlPlugin = (): Plugin => {
  return {
    name: 'bundil-yaml',
    load(id) {
      if (!/\.ya?ml$/u.test(id)) {
        return null
      }
      this.addWatchFile(id)
      const source = fs.readFileSync(id, 'utf8')
      const parsed: unknown = parseYaml(source)
      return `export default ${JSON.stringify(parsed)}`
    },
  }
}
const ensureSingleInput = (input: InputOptions['input']) => {
  if (input === undefined) {
    return 'src/main.ts'
  }
  if (typeof input === 'string') {
    return input
  }
  if (Array.isArray(input)) {
    if (input.length !== 1) {
      throw new TypeError('Bundil expects a single entry input.')
    }
    return input[0]
  }
  const objectEntries = Object.entries(input)
  if (objectEntries.length !== 1) {
    throw new TypeError('Bundil expects exactly one named entry input.')
  }
  return objectEntries[0][1]
}
const findPackageRoot = (file: string) => {
  let current = dirname(file)
  while (true) {
    if (fs.existsSync(join(current, 'package.json'))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) {
      return
    }
    current = parent
  }
}
const getImportedPackageName = (source: string) => {
  if (!source || source.startsWith('\0') || source.startsWith('.') || source.startsWith('/')) {
    return
  }
  if (/^[A-Za-z]:[/\\]/u.test(source)) {
    return
  }
  if (/^[a-z]+:/u.test(source)) {
    return
  }
  if (source.startsWith('@')) {
    const [scope, name] = source.split('/')
    if (!scope || !name) {
      return
    }
    return `${scope}/${name}`
  }
  const [name] = source.split('/')
  return name || undefined
}
const getOutputChunksMatchingFileNamePattern = (bundle: OutputBundle, fileNamePattern: RegExp): Array<OutputChunk> => {
  return Object.values(bundle).filter((bundleItem): bundleItem is OutputChunk => {
    return bundleItem.type === 'chunk' && fileNamePattern.test(bundleItem.fileName)
  })
}
const getEntryChunkFileName = (bundle: OutputBundle, fileNamePattern: RegExp) => {
  const entryChunk = getOutputChunksMatchingFileNamePattern(bundle, fileNamePattern).find(bundleItem => {
    return bundleItem.isEntry
  })
  return entryChunk?.fileName
}
const isBuiltinImport = (source: string) => {
  return builtinImportNames.has(source) || isBuiltin(source)
}
const isDeclarationChunkFileName = (fileName: string) => {
  return declarationChunkFileNamePattern.test(fileName)
}
const isPackageImport = (source: string) => {
  return getImportedPackageName(source) !== undefined
}
const isPathInsideFolder = (file: string, folder: string) => {
  const relativePath = relative(folder, file)
  return relativePath === '' || !relativePath.startsWith('..') && !relativePath.includes(':')
}
const matchesExternalOption = (external: ExternalOption | undefined, source: string, importer: string | undefined, isResolved = false): boolean => {
  if (!external) {
    return false
  }
  if (typeof external === 'function') {
    return external(source, importer, isResolved) === true
  }
  const entries = Array.isArray(external) ? external : [external]
  return entries.some(entry => {
    if (typeof entry === 'string') {
      return source === entry || source.startsWith(`${entry}/`)
    }
    return entry.test(source)
  })
}
const normalizeChunkFileName = (fileName: string) => {
  if (/\.d\.[cm]?ts$/u.test(fileName)) {
    return fileName
  }
  return fileName.replace(/\.([cm]?ts)$/u, '.d.$1')
}
const packageJsonFileFromFolder = (folder: string) => {
  return join(folder, 'package.json')
}
const pickBundilOptions = (options?: BundilOptions['parameter']) => {
  return Object.fromEntries(Object.entries({
    externals: options?.externals,
    output: options?.output,
  }).filter(([, value]) => value !== undefined))
}
const readPackageJsonIfExists = (folder: string): RootPackageJson => {
  const packageJsonFile = packageJsonFileFromFolder(folder)
  if (!fs.existsSync(packageJsonFile)) {
    return {}
  }
  return fs.readJsonSync(packageJsonFile) as RootPackageJson
}
const readTextFileIfExists = async (file: string) => {
  try {
    return await fs.readFile(file, 'utf8')
  } catch (error) {
    const errnoException = error as NodeJS.ErrnoException
    if (errnoException.code === 'ENOENT') {
      return
    }
    throw error
  }
}
const resolveDependencyPackageRoot = (cwd: string, packageName: string) => {
  const requireFromCwd = createRequire(join(cwd, 'package.json'))
  try {
    const resolvedEntry = fs.realpathSync(requireFromCwd.resolve(packageName))
    return findPackageRoot(resolvedEntry)
  } catch {

  }
}
const resolveRuntimePackageState = (cwd: string): RuntimePackageState => {
  const packageJson = readPackageJsonIfExists(cwd)
  const dependencyPackageNames = packageJsonDependencyFieldNames.flatMap(fieldName => {
    return Object.keys(packageJson[fieldName] ?? {})
  })
  const dependencyPackageRoots = dependencyPackageNames.flatMap(packageName => {
    const rootFolder = resolveDependencyPackageRoot(cwd, packageName)
    if (!rootFolder) {
      return []
    }
    return [rootFolder]
  })
  return {
    dependencyPackageNames,
    dependencyPackageRoots,
  }
}
function toEntryExport({declarationEntryFileName, scriptEntryFileName}: DistributionEntryFiles, format: ModuleFormat): EntryExport {
  const scriptEntryPath = `./${scriptEntryFileName}`
  return {
    default: scriptEntryPath,
    [isCommonJsFormat(format) ? 'require' : 'import']: scriptEntryPath,
    ...declarationEntryFileName ? {
      types: `./${declarationEntryFileName}`,
    } : {},
  }
}
const toDistributionPackageJson = (rootPackageJson: RootPackageJson, publishedPackageJson: RootPackageJson, entryFiles: DistributionEntryFiles, format: ModuleFormat): RootPackageJson => {
  if (!rootPackageJson.name) {
    throw new Error('The root package.json is missing “name”.')
  }
  if (!rootPackageJson.version) {
    throw new Error('The root package.json is missing “version”.')
  }
  const entryExport = toEntryExport(entryFiles, format)
  return {
    ...publishedPackageJson,
    ...rootPackageJson.bin ? {bin: rootPackageJson.bin} : {},
    ...rootPackageJson.funding ? {funding: rootPackageJson.funding} : {},
    ...rootPackageJson.peerDependenciesMeta ? {peerDependenciesMeta: rootPackageJson.peerDependenciesMeta} : {},
    ...rootPackageJson.sideEffects !== undefined ? {sideEffects: rootPackageJson.sideEffects} : {},
    name: rootPackageJson.name,
    version: rootPackageJson.version,
    type: isCommonJsFormat(format) ? 'commonjs' : 'module',
    exports: {
      '.': entryExport,
    },
    ...entryExport.types ? {types: entryExport.types} : {},
  }
}
const toPluginOptionsArray = <PluginOption>(plugins: Array<PluginOption> | PluginOption | false | null | undefined = undefined): Array<PluginOption> => {
  if (plugins === undefined || plugins === null || plugins === false) {
    return []
  }
  return Array.isArray(plugins) ? plugins : [plugins]
}

export default class Bundil {
  readonly options: BundilOptions['merged']
  private cwd = process.cwd()
  private runtimePackageState: RuntimePackageState = {
    dependencyPackageNames: [],
    dependencyPackageRoots: [],
  }

  constructor(options?: BundilOptions['parameter']) {
    this.options = bundilOptionsSchema.process(pickBundilOptions(options))
  }

  get externals() {
    return this.options.externals
  }

  get outputFolder() {
    return this.options.output
  }

  getPublishimoExcludeFields() {
    if (this.externals === 'dependencies') {
      return []
    }
    return [...packageJsonDependencyFieldNames]
  }

  makeConfig(options: RolldownOptions = {}): RolldownOptions {
    const inputOptions = this.makeInputOptions(options)
    if (Array.isArray(options.output)) {
      return {
        ...inputOptions,
        output: options.output.map(outputOptions => this.makeOutputOptions(outputOptions)),
      }
    }
    return {
      ...inputOptions,
      output: this.makeOutputOptions(options.output ?? {}),
    }
  }

  makeInputOptions(options: InputOptions = {}): InputOptions {
    this.cwd = resolve(options.cwd ?? process.cwd())
    this.runtimePackageState = resolveRuntimePackageState(this.cwd)
    return {
      ...options,
      cwd: this.cwd,
      external: (source, importer, isResolved) => {
        if (isBuiltinImport(source)) {
          return true
        }
        if (this.externals === 'dependencies' && isPackageImport(source)) {
          return true
        }
        return matchesExternalOption(options.external, source, importer, isResolved)
      },
      input: ensureSingleInput(options.input),
      plugins: [
        ...toPluginOptionsArray(options.plugins),
        createYamlPlugin(),
      ],
    }
  }

  makeOutputOptions(options: OutputOptions = {}): OutputOptions {
    const outputOptions: OutputOptions = {
      ...options,
      assetFileNames: options.assetFileNames ?? '[name][extname]',
      dir: this.outputFolder,
      entryFileNames: chunk => {
        if (chunk.name.endsWith('.d')) {
          return 'lib.d.js'
        }
        return 'lib.js'
      },
      format: options.format ?? 'es',
    }
    delete outputOptions.file
    if (this.externals === 'side') {
      outputOptions.chunkFileNames = chunk => {
        if (chunk.name === 'vendor') {
          return 'vendor.js'
        }
        if (typeof options.chunkFileNames === 'function') {
          return options.chunkFileNames(chunk)
        }
        return options.chunkFileNames ?? '[name].js'
      }
      /* eslint-disable typescript/no-deprecated */
      outputOptions.manualChunks = (id, meta) => {
        if (typeof options.manualChunks === 'function') {
          const manualChunkName = options.manualChunks(id, meta)
          if (manualChunkName) {
            return manualChunkName
          }
        }
        if (this.shouldPlaceModuleInVendorChunk(id)) {
          return 'vendor'
        }
      }
      /* eslint-enable typescript/no-deprecated */
      return outputOptions
    }
    outputOptions.chunkFileNames = options.chunkFileNames ?? '[name].js'
    return outputOptions
  }

  private shouldPlaceModuleInVendorChunk(id: string) {
    if (!id || id.startsWith('\0') || isBuiltinImport(id)) {
      return false
    }
    const normalizedId = id.replaceAll('\\', '/')
    if (normalizedId.includes('/node_modules/')) {
      return true
    }
    return this.runtimePackageState.dependencyPackageRoots.some(rootFolder => {
      return isPathInsideFolder(resolve(id), rootFolder)
    })
  }
}

export const createBundilConfig = (options: RolldownOptions = {}, bundilOptions?: BundilOptions['parameter']): RolldownOptions => {
  return new Bundil(bundilOptions).makeConfig(options)
}
export const createBundilInputOptions = (options: InputOptions = {}, bundilOptions?: BundilOptions['parameter']): InputOptions => {
  return new Bundil(bundilOptions).makeInputOptions(options)
}
export const createBundilOutputOptions = (options: OutputOptions = {}, bundilOptions?: BundilOptions['parameter']): OutputOptions => {
  return new Bundil(bundilOptions).makeOutputOptions(options)
}
export const createCopyTextFilePlugin = ({inputFileName, outputFileName, pluginName}: CopyTextFilePluginOptions): Plugin => {
  let sourceFile = resolve(inputFileName)
  return {
    name: pluginName,
    async buildStart(options) {
      sourceFile = resolve(options.cwd, inputFileName)
      try {
        await fs.access(sourceFile)
        this.addWatchFile(sourceFile)
      } catch (error) {
        const errnoException = error as NodeJS.ErrnoException
        if (errnoException.code !== 'ENOENT') {
          throw error
        }
      }
    },
    async generateBundle() {
      const source = await readTextFileIfExists(sourceFile)
      if (source === undefined) {
        return
      }
      this.emitFile({
        type: 'asset',
        fileName: outputFileName,
        originalFileName: sourceFile,
        source,
      })
    },
  }
}
export {
  bundilOptionsSchema,
  createYamlPlugin,
  getEntryChunkFileName,
  getOutputChunksMatchingFileNamePattern,
  isDeclarationChunkFileName,
  normalizeChunkFileName,
  packageJsonDependencyFieldNames,
  toDistributionPackageJson,
  toEntryExport,
  toPluginOptionsArray,
}
