import { PackageInfo, PACKAGE_TYPE } from "@/common/config";
import { RuleSetRule } from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import {
  autoPrefixer,
  createCssLoader,
  createLessLoader,
  createPostcssLoader,
  pxToRem,
} from "./styles";
import { createAssetLoader, createMediaLoader } from "./assets";

const reactBabel: any = {
  test: /\.(js|ts)x?$/,
  exclude: /node_modules/,
  use: [
    {
      loader: "babel-loader",
      options: {
        presets: [
          "@babel/preset-env",
          "@babel/preset-react",
          "@babel/preset-typescript",
        ],
        cacheDirectory: true,
        cacheCompression: false,
        plugins: [
          "@babel/plugin-transform-runtime",
          "@babel/plugin-transform-modules-commonjs",
        ].filter(Boolean),
      },
    },
  ],
};

export default function createModule(pkg: PackageInfo): RuleSetRule[] {
  const styleLess: any = {
    test: /\.(css|less)$/,
    exclude: /\.module\.(css|less)$/,
    use: [
      createCssLoader(),
      createPostcssLoader(["postcss-preset-env", autoPrefixer, pxToRem]),
      createLessLoader(),
    ],
  };
  const styleModuleLess: any = {
    test: /\.module.(css|less)$/,
    use: [
      createCssLoader(true),
      createPostcssLoader(["postcss-preset-env", autoPrefixer, pxToRem]),
      createLessLoader(),
    ],
  };
  const list = [reactBabel, createAssetLoader(pkg), createMediaLoader(pkg)];
  if (![PACKAGE_TYPE.APP].includes(pkg.type)) {
    styleLess.use.unshift(MiniCssExtractPlugin.loader);
    styleModuleLess.use.unshift(MiniCssExtractPlugin.loader);
  } else {
    styleLess.use.unshift("style-loader");
    styleModuleLess.use.unshift("style-loader");
  }
  if (pkg.theme) {
    styleLess.use.push({
      loader: "style-resources-loader",
      options: {
        patterns: pkg.theme,
      },
    });
    styleModuleLess.use.push({
      loader: "style-resources-loader",
      options: {
        patterns: pkg.theme,
      },
    });
  }
  return list.concat([styleLess, styleModuleLess]);
}
