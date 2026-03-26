import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import { viteRequire } from 'vite-require'
import { IgnorePublicPlugin } from 'vite-plugin-ignore-public'

export default defineConfig({
    publicDir: 'public',
    server: {
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        }
    },
    esbuild: {
//         loader: "jsx",
        jsx: 'transform',
        jsxDev: true,
        jsxImportSource: '@',
        jsxInject: "import { createElement, Fragment } from '@b9g/crank'",
        jsxFactory: 'createElement',
        jsxFragment: 'Fragment',
    },
    plugins: [
        IgnorePublicPlugin(),
        viteRequire(),
        babel({
            babelConfig: {
                sourceMaps: true,
                presets: [
                    ['@babel/preset-env', {modules: false}]
                ],
                plugins: [
                    '@babel/plugin-syntax-jsx',
                    ['@babel/plugin-proposal-decorators', {version: '2023-11'}],
                    '@babel/plugin-proposal-do-expressions',
                    '@babel/plugin-proposal-function-bind',
                    ['babel-plugin-extensible-destructuring', {mode: 'optout', impl: 'immutable'}],
                ],
            }
      })
    ]
})
