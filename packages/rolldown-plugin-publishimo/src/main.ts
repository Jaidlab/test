import type {RootPackageJson} from 'bundil'
import type {options as PublishimoOptions, result as PublishimoResult} from 'publishimo'
import type {ModuleFormat, Plugin} from 'rolldown'

import {resolve} from 'node:path'

import {getEntryChunkFileName, toDistributionPackageJson} from 'bundil'
import fs from 'fs-extra'
import publishimoModule from 'publishimo'

export type PublishimoPluginOptions = {
  extend?: RootPackageJson
  pretty?: boolean
  publishimoOptions?: PublishimoOptions
}

type PublishimoFunction = (options: PublishimoOptions) => Promise<PublishimoResult>

const resolvePublishimo = (moduleExport: unknown): PublishimoFunction => {
  if (typeof moduleExport === 'function') {
    return moduleExport as PublishimoFunction
  }
  if (moduleExport && typeof moduleExport === 'object' && 'default' in moduleExport) {
    const defaultExport = (moduleExport as {default: unknown}).default
    if (typeof defaultExport === 'function') {
      return defaultExport as PublishimoFunction
    }
  }
  throw new TypeError('Unsupported publishimo export shape.')
}
const publishimo = resolvePublishimo(publishimoModule)
const readRootPackageJson = async (packageJsonFile: string): Promise<RootPackageJson> => {
  const packageJsonContent = await fs.readFile(packageJsonFile, 'utf8')
  return JSON.parse(packageJsonContent) as RootPackageJson
}
const formatPackageJson = (value: unknown, pretty = false) => {
  return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
}
const toModuleFormat = (format: ModuleFormat | 'esm') => {
  return format === 'esm' ? 'es' : format
}
const createPublishimoPlugin = (pluginOptions: PublishimoPluginOptions = {}): Plugin => {
  const options = {
    pretty: false,
    ...pluginOptions,
  }
  let packageJsonFile = resolve('package.json')
  return {
    name: 'publishimo',
    async buildStart(inputOptions) {
      packageJsonFile = resolve(inputOptions.cwd, 'package.json')
      try {
        await fs.access(packageJsonFile)
        this.addWatchFile(packageJsonFile)
      } catch (error) {
        const errnoException = error as NodeJS.ErrnoException
        if (errnoException.code !== 'ENOENT') {
          throw error
        }
      }
    },
    async generateBundle(outputOptions, bundle) {
      const rootPackageJson = await readRootPackageJson(packageJsonFile)
      const scriptEntryFileName = getEntryChunkFileName(bundle, /\.[cm]?js$/u)
      if (!scriptEntryFileName) {
        throw new Error('No JavaScript entry chunk was emitted.')
      }
      const declarationEntryFileName = getEntryChunkFileName(bundle, /\.(?:d\.)?[cm]?ts$/u)
      const {output: _output, ...publishimoOptions} = options.publishimoOptions ?? {}
      const publishimoResult = await publishimo({
        ...publishimoOptions,
        pkg: packageJsonFile,
      })
      const distributionPackageJson = {
        ...toDistributionPackageJson(rootPackageJson, publishimoResult.generatedPkg as RootPackageJson, {
          declarationEntryFileName,
          scriptEntryFileName,
        }, toModuleFormat(outputOptions.format)),
        ...options.extend,
      }
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        originalFileName: packageJsonFile,
        source: formatPackageJson(distributionPackageJson, options.pretty),
      })
    },
  }
}

export default createPublishimoPlugin
