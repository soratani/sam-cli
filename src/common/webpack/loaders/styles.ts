import autoprefixer from "autoprefixer";
import pxtorem from "postcss-pxtorem";

export const autoPrefixer = autoprefixer();
export const pxToRem = pxtorem({
  rootValue: 16, // 基准值（浏览器默认字体大小为 16px）
  unitPrecision: 5, // 单位精度
  propList: ["*"], // 要转换的属性列表，'*' 表示所有单位为 px 的属性都会被转换
  selectorBlackList: [], // 忽略不需要转换的选择器
  replace: true, // 是否替换包含 rem 的属性值而不是添加 fallback
  mediaQuery: true, // 允许在媒体查询中转换 px
  minPixelValue: 0, // 设置最小转换数值，小于这个值的 px 不会被转换
});
export function createPostcssLoader(plugins = []) {
  const postcssOptions = { plugins: [] };
  if (plugins.length) {
    postcssOptions.plugins = plugins;
    return { loader: "postcss-loader", options: { postcssOptions } };
  }
  return "postcss-loader";
}

export function createLessLoader() {
  return {
    loader: "less-loader",
    options: {
      lessOptions: {
        javascriptEnabled: true,
      },
    },
  };
}

export function createCssLoader(module = false) {
  const options = {
    esModule: false,
    modules: {
      auto: true,
      exportGlobals: true,
    },
  };
  if (module) {
    return { loader: "css-loader", options };
  }
  return "css-loader";
}
