import type {BundilOptions} from 'bundil'
import type {Plugin, RolldownPluginOption} from 'rolldown'

import Bundil, {toPluginOptionsArray} from 'bundil'
import {dts} from 'rolldown-plugin-dts'
import licensePlugin from 'rolldown-plugin-license'
import minifyPlugin from 'rolldown-plugin-minify'
import minifyDtsPlugin from 'rolldown-plugin-minify-dts'
import publishimoPlugin from 'rolldown-plugin-publishimo'
import readmePlugin from 'rolldown-plugin-readme'

export const createBundilPlugins = (bundil = new Bundil): Array<RolldownPluginOption> => {
  return [
    ...dts(),
    minifyPlugin(),
    minifyDtsPlugin(),
    publishimoPlugin({
      publishimoOptions: {
        excludeFields: bundil.getPublishimoExcludeFields(),
      },
    }),
    licensePlugin(),
    readmePlugin(),
  ]
}

const createBundilPlugin = (options?: BundilOptions['parameter']): Plugin => {
  const bundil = new Bundil(options)
  return {
    name: 'bundil',
    options(draft) {
      const inputOptions = bundil.makeInputOptions(draft)
      return {
        ...inputOptions,
        plugins: [
          ...toPluginOptionsArray(inputOptions.plugins),
          ...createBundilPlugins(bundil),
        ],
      }
    },
    outputOptions(draft) {
      return bundil.makeOutputOptions(draft)
    },
  }
}

export default createBundilPlugin
