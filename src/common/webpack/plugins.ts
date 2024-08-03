import Config, { ApplicationInfo, APPTYPE, ENV } from "@/common/config";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import HtmlWebpackTagsPlugin from "html-webpack-tags-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ModuleConcatenationPlugin from "webpack/lib/optimize/ModuleConcatenationPlugin";
import webpack, { DefinePlugin } from "webpack";
import EslintWebpackPlugin from "eslint-webpack-plugin";
import dotenv from 'dotenv';
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { findFiles } from "@/utils";
import { readFileSync } from "fs";
import { join } from "path";


function mergeEnvs(target: any, source: any): any {
  const temp = { ...target, ...source };
  return Object.keys(temp).reduce((pre, item) => {
    pre[item] = JSON.stringify(temp[item]);
    return pre;
  }, {});
}

export default function createPlugins(pkg: ApplicationInfo, config: Config) {
  let cssFilename = "static/style/[name].[contenthash:8].css";
  let cssChunkFilename = "static/style/[id].[contenthash:8].chunk.css";
  let envObj = {
    ENV: config.env,
    VERSION: pkg.version,
    PLATFORM: pkg.env,
    APP: pkg.name,
  }
  const isApp = [APPTYPE.APP].includes(pkg.type);
  if (isApp) {
    cssFilename = "static/style/[name].css";
    cssChunkFilename = "static/style/[name].chunk.css";
  }
  if (pkg.envFile) {
    envObj = mergeEnvs(envObj, dotenv.parse(readFileSync(pkg.envFile)));
  }
  const assets = findFiles(pkg.public);
  const templateDir = join(__dirname, "../../../templates");
  const templateContent = readFileSync(
    join(templateDir, `${pkg.env}.html`)
  ).toString();
  const publicFiles = new HtmlWebpackTagsPlugin({
    links: assets.filter((file) => file.includes(".css")),
    tags: assets.filter((file) => file.includes(".js")),
    append: false,
  });
  const copy = new CopyWebpackPlugin({
    patterns: [
      {
        from: pkg.public,
        to: pkg.output,
        filter(filepath: string) {
          return !filepath.includes(".html");
        },
      },
    ],
  });
  const template = new HtmlWebpackPlugin({
    templateContent,
    filename: "index.html",
    inject: "head",
  });
  const plugins = [
    new CleanWebpackPlugin(),
    new EslintWebpackPlugin({
      context: pkg.root,
      cache: true,
    }),
    new DefinePlugin({
      process: {
        env: envObj
      }
    }),
    new MiniCssExtractPlugin({
      filename: cssFilename,
      chunkFilename: cssChunkFilename,
    }),
    new webpack.ProvidePlugin({
      React: "react", // 这样在任何地方都可以直接使用React，无需import
      ReactDOM: "react-dom",
    }),
    new ModuleConcatenationPlugin(),
  ];
  const isCssChunk = ![APPTYPE.APP].includes(pkg.type);
  const isTemplate = isCssChunk || [ENV.development].includes(config.env);
  const isCopy = isTemplate && pkg.public;
  if (isCopy) plugins.push(copy);
  if (isTemplate) plugins.push(template);
  if (pkg.public && isTemplate) plugins.push(publicFiles);
  return plugins;
}
