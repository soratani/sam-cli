import { APPTYPE, ApplicationInfo } from "@/common/config";

export function createAssetLoader(pkg: ApplicationInfo, maxSize = 8 * 1024) {
  let filename = "static/image/[name].[contenthash:8][ext]";
  if ([APPTYPE.APP].includes(pkg.type)) {
    filename = "image/[name].[ext]";
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

export function createMediaLoader(pkg: ApplicationInfo) {
  let filename = "static/media/[name].[contenthash:8][ext]";
  if ([APPTYPE.APP].includes(pkg.type)) {
    filename = "media/[name].[ext]";
  }
  return {
    test: /\.(woff2?|eot|ttf|otf|mp3|mp4|avi|mkv)$/i,
    type: "asset/resource",
    generator: {
      filename,
    },
  };
}
