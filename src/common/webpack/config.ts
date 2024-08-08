import TerserWebpackPlugin from "terser-webpack-plugin";
import CssMinimizerWebpackPlugin from "css-minimizer-webpack-plugin";
import { Configuration } from "webpack";
import createPlugins from "./plugins";
import createModule from "./loaders";
import Config, { ENV, APPTYPE, ApplicationInfo } from "../config";
import createAlias from "./alias";

function optimization(pkg: ApplicationInfo) {
  const opt: any = {
    minimize: true,
    usedExports: true,
    minimizer: [
      new CssMinimizerWebpackPlugin(),
      new TerserWebpackPlugin({
        parallel: 2,
      }),
    ],
  };
  if (![APPTYPE.APP].includes(pkg.type)) {
    opt["splitChunks"] = {
      chunks: "all",
      name: false,
      cacheGroups: {
        react: {
          name: "react",
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          priority: 10,
          chunks: "all",
        },
        fingerprintjs: {
          name: "fingerprintjs",
          test: /[\\/]node_modules[\\/]@fingerprintjs[\\/]fingerprintjs[\\/]/,
        },
        common: {
          name: "common",
          minChunks: 2,
          priority: 5,
          chunks: "all",
        },
      },
    };
    opt["runtimeChunk"] = {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    };
  }
  return opt;
}

function createOutput(pkg: ApplicationInfo) {
  const output = {
    path: pkg.output,
    filename: "static/[name].[contenthash:8].js",
    chunkFilename: "static/[name].[contenthash:8].chunk.js",
    clean: true,
  };
  if ([APPTYPE.APP].includes(pkg.type)) {
    output["filename"] = "[name].js";
    output["chunkFilename"] = "static/[name].chunk.js";
    output["publicPath"] = `${pkg.name}`;
  } else {
    output["publicPath"] = "/";
  }
  return output;
}

export default function (pkg: ApplicationInfo, config: Config): Configuration {
  const output = createOutput(pkg);
  const alias = createAlias(pkg, config.packages);
  const dev = [ENV.development].includes(config.env);

  return {
    mode: dev ? "development" : "production", // 模式
    cache: true,
    entry: pkg.main,
    devtool: "inline-source-map",
    // devtool: dev ? "inline-source-map" : false,
    output,
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      alias,
      fallback: alias,
    },
    plugins: createPlugins(pkg, config),
    module: {
      rules: createModule(pkg),
    },
    optimization: optimization(pkg),
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    stats: false,
  };
}
