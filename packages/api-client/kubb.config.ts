import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  root: '.',
  input: {
    path: './swagger.json',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({}),
    pluginTs({
      output: {
        path: 'types',
      },
    }),
    pluginTanstackQuery({
      output: {
        path: 'hooks',
      },
      framework: 'react',
      suspense: false,
    }),
    pluginZod({
      output: {
        path: 'zod',
      },
    }),
  ],
})
