import webpack from "webpack";
import { get } from 'lodash';
import createConfig from "./config";
import Config, { PackageInfo } from "../config";

export default function run(pkg: PackageInfo, config: Config) {
  const webpackConfig = createConfig(pkg, config);
  return new Promise<PackageInfo>((resolve, reject) => {
    webpack(webpackConfig, function (err, stats) {
      const error = get(stats, "compilation.errors.0", "");
      if (err || error) {
        reject(err || error);
      } else {
        resolve(pkg);
      }
    });
  });
}
