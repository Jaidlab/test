import type {Plugin} from 'rolldown'

import {isDeclarationChunkFileName} from 'bundil'
import {minifyDts} from 'minify-dts'

const createMinifyTypeDeclarationsPlugin = (): Plugin => {
  return {
    name: 'minify-type-declarations',
    generateBundle(_outputOptions, bundle) {
      for (const [, bundleItem] of Object.entries(bundle)) {
        if (bundleItem.type !== 'chunk' || !isDeclarationChunkFileName(bundleItem.fileName)) {
          continue
        }
        bundleItem.code = minifyDts(bundleItem.code)
      }
    },
  }
}

export default createMinifyTypeDeclarationsPlugin
