import { PACKAGE_TYPE, PackageInfo } from "@/utils/config";
import TerserWebpackPlugin from 'terser-webpack-plugin';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import { Configuration } from "webpack";
import createPlugins from "./plugins";
import createModule from "./loader";

export default function (pkg: PackageInfo, alias: Record<string, string>): Configuration {
    const output = {
        path: pkg.output,
        filename: pkg.type === PACKAGE_TYPE.APP ? 'static/[name].js' : 'static/[name].[contenthash:8].js',
        clean: true,
    }
    if (pkg.type !== PACKAGE_TYPE.APP) output['chunkFilename'] = 'static/[name].[contenthash:8].chunk.js'
    return {
        mode: 'production', // 模式
        cache: false,
        entry: pkg.main,
        devtool: false,
        output,
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            alias,
        },
        plugins: createPlugins(pkg),
        module: {
            rules: createModule(pkg),
        },
        optimization: {
            minimize: true,
            usedExports: true,
            minimizer: [
                new CssMinimizerWebpackPlugin(),
                new TerserWebpackPlugin({
                    parallel: true,
                }),
            ],
            splitChunks: {
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
            },
            runtimeChunk: {
                name: (entrypoint) => `runtime-${entrypoint.name}`,
            },
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        stats: {
            assets: true,
            groupModulesByExtension: true,
            groupModulesByPath: true,
            nestedModules: true,
            moduleAssets: true,
            builtAt: true,
            assetsSort: 'size',
        }
    }
}