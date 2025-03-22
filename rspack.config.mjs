import { defineConfig } from '@rspack/cli';
import { HtmlRspackPlugin } from '@rspack/core';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  entry: {
    main: './src/main.ts',
  },
  devServer: {
    static: ['dist', 'public'],
    port: 6969,
    hot: true,
    compress: true,
  },
  plugins: [
    new HtmlRspackPlugin({
      template: './index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // Apply this rule to .ts and .tsx files
        exclude: /node_modules/, // Exclude node_modules
        use: {
          loader: 'builtin:swc-loader', // Use SWC loader for TypeScript
          options: {
            jsc: {
              parser: {
                syntax: 'typescript', // Use TypeScript syntax
                tsx: true, // Enable TSX support
              },
              target: 'es2015',
            },
          },
        },
      },
    ],
  },
});