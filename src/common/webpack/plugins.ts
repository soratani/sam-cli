import { PackageInfo, PACKAGE_TYPE, } from "@/utils/config";
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackTagsPlugin from 'html-webpack-tags-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ModuleConcatenationPlugin from 'webpack/lib/optimize/ModuleConcatenationPlugin';
import webpack, { DefinePlugin } from 'webpack';
import EslintWebpackPlugin from 'eslint-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { join } from "path";
import { findFiles } from "@/utils";


export default function createPlugins(pkg: PackageInfo) {
    const assets = findFiles(pkg.public);
    const plugins = [
        new CleanWebpackPlugin(),
        new EslintWebpackPlugin({
            context: pkg.source,
            cache: true,
        }),
        new DefinePlugin({
            "process.env": {
                NAME: JSON.stringify(pkg.name),
                VERSION: JSON.stringify(pkg.version),
                PLATFORM: JSON.stringify(pkg.type),
                APP: JSON.stringify(pkg.name),
            }
        }),
        new webpack.ProvidePlugin({
            React: "react", // 这样在任何地方都可以直接使用React，无需import
            ReactDOM: "react-dom",
        }),
        new ModuleConcatenationPlugin(),
    ];
    if (pkg.public) {
        plugins.push(new CopyWebpackPlugin({
            patterns: [
                {
                    from: pkg.public,
                    to: pkg.output,
                },
            ],
        }),)
    }
    if (![PACKAGE_TYPE.APP].includes(pkg.type)) {
        plugins.push(new MiniCssExtractPlugin({
            filename: `static/style/[name].[contenthash:8].css`,
            chunkFilename: `static/style/[id].[contenthash:8].chunk.css`,
        }))
    }
    if (pkg.public) {
        plugins.push(new HtmlWebpackPlugin({
            template: pkg.template,
            filename: "index.html",
            inject: "head",
        }), 
        new HtmlWebpackTagsPlugin({
            links: assets.filter((file) => file.includes(".css")),
            tags: assets.filter((file) => file.includes(".js")),
            append: false,
        }))
    }
    return plugins;
}