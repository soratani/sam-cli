import webpack from "webpack";
import { get } from 'lodash';
import createConfig from './config';
import { Common, PackageInfo } from "@/utils/config";
import createAlias from "./alias";

export default function run(pkg: PackageInfo, common: Common[]) {
  const alias = createAlias(pkg, common);
  const config = createConfig(pkg, alias);
  return new Promise<PackageInfo>((resolve, reject) => {
    webpack(config, function (err, stats) {
      const error = get(stats, "compilation.errors.0", "");
      if (err || error) {
        reject(err || error);
      } else {
        resolve(pkg);
      }
    });
  });
}
