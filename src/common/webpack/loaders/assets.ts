import { PACKAGE_TYPE, PackageInfo } from "@/common/config";

export function createAssetLoader(pkg: PackageInfo, maxSize = 8 * 1024) {
  const prefix = [PACKAGE_TYPE.APP].includes(pkg.type) ? "static" : "/static";
  let filename = `${prefix}/image/[name].[contenthash:8][ext]`;
  if ([PACKAGE_TYPE.APP].includes(pkg.type)) {
    filename = "image/[name].[contenthash:8][ext]";
  }
  return {
    test: /\.(png|jpe?g|gif|webp|svg|ico)$/,
    type: "asset",
    parser: {
      dataUrlCondition: {
        maxSize,
      },
    },
    generator: {
      filename,
    },
  };
}

export function createMediaLoader(pkg: PackageInfo) {
  const prefix = [PACKAGE_TYPE.APP].includes(pkg.type) ? "static" : "/static";
  let filename = `${prefix}/media/[name].[contenthash:8][ext]`;
  if ([PACKAGE_TYPE.APP].includes(pkg.type)) {
    filename = "image/media/[name].[contenthash:8][ext]";
  }
  return {
    test: /\.(woff2?|eot|ttf|otf|mp3|mp4|avi|mkv)$/i,
    type: "asset/resource",
    generator: {
      filename,
    },
  };
}
