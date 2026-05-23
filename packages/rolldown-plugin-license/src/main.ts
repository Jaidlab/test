import {createCopyTextFilePlugin} from 'bundil'

const createLicensePlugin = () => {
  return createCopyTextFilePlugin({
    inputFileName: 'license.txt',
    outputFileName: 'LICENSE',
    pluginName: 'license',
  })
}

export default createLicensePlugin
