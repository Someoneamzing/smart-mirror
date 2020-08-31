// const nodeExternals = require('webpack-node-externals');

module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/main.js',
      // the source template
      template: 'public/index.html',
      // output as dist/index.html
      filename: 'index.html',
      // when using title option,
      // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
      title: 'Smart Mirror',
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    auth: 'src/auth.js'
  },
  configureWebpack: {
    // target: 'electron-renderer',
    // externals: [nodeExternals({allowlist: [/@material/, /lit-/, 'material-deisgn-icons/iconfont/material-icons.css']})],
  }
}
