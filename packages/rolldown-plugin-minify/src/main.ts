import type {Plugin} from 'rolldown'

import {getOutputChunksMatchingFileNamePattern} from 'bundil'
import * as terser from 'terser'

export type MinificationResult = {
  code: string
  minifiedSize: number
  originalSize: number
}

const getByteLength = (content: string) => {
  return Buffer.byteLength(content)
}

export const minifyJavaScript = async (code: string): Promise<MinificationResult> => {
  const originalSize = getByteLength(code)
  const result = terser.minify_sync(code, {
    compress: {
      passes: 100,
    },
    ecma: 2020,
    format: {
      beautify: false,
      semicolons: false,
    },
    module: true,
    toplevel: true,
  })
  if (!result.code) {
    throw new Error('JavaScript minification failed.')
  }
  return {
    code: result.code,
    minifiedSize: getByteLength(result.code),
    originalSize,
  }
}

const createMinifyJavaScriptPlugin = (): Plugin => {
  return {
    name: 'minify-javascript',
    async generateBundle(_outputOptions, bundle) {
      for (const bundleItem of getOutputChunksMatchingFileNamePattern(bundle, /\.[cm]?js$/u)) {
        const minificationResult = await minifyJavaScript(bundleItem.code)
        bundleItem.code = minificationResult.code
      }
    },
  }
}

export default createMinifyJavaScriptPlugin
