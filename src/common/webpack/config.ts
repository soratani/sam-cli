import TerserWebpackPlugin from "terser-webpack-plugin";
import CssMinimizerWebpackPlugin from "css-minimizer-webpack-plugin";
import { Configuration } from "webpack";
import createPlugins from "./plugins";
import createModule from "./loader";
import Config, { PACKAGE_TYPE, PackageInfo } from "../config";
import createAlias from "./alias";

function optimization(pkg: PackageInfo) {
  const opt: any = {
    minimize: true,
    usedExports: true,
    minimizer: [
      new CssMinimizerWebpackPlugin(),
      new TerserWebpackPlugin({
        parallel: true,
      }),
    ],
  };
  if (![PACKAGE_TYPE.APP].includes(pkg.type)) {
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

function createOutput(pkg: PackageInfo) {
  const output = {
    path: pkg.output,
    filename: "static/[name].[contenthash:8].js",
    clean: true,
  };
  if ([PACKAGE_TYPE.APP].includes(pkg.type)) {
    output["filename"] = "[name].js";
  } else {
    output["chunkFilename"] = "static/[name].[contenthash:8].chunk.js";
  }
  return output;
}

export default function (pkg: PackageInfo, config: Config): Configuration {
  const output = createOutput(pkg);
  const alias = createAlias(pkg, config.commons);
  return {
    mode: "production", // 模式
    cache: false,
    entry: pkg.main,
    devtool: false,
    output,
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      alias,
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
  };
}
