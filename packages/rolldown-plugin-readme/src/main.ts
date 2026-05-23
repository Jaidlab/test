import {createCopyTextFilePlugin} from 'bundil'

const createReadmePlugin = () => {
  return createCopyTextFilePlugin({
    inputFileName: 'readme.md',
    outputFileName: 'README.md',
    pluginName: 'readme',
  })
}

export default createReadmePlugin
