import webpack from "webpack";
import { get } from 'lodash';
import createConfig from './config';
import { Common, PackageInfo } from "@/utils/config";
import createAlias from "./alias";

export default function run(pkg: PackageInfo, common: Common[]) {
  const alias = createAlias(pkg, common);
  console.log(alias, pkg.name);
  const config = createConfig(pkg, alias);
  webpack(config, function(err, stats) {
    const error = get(stats, 'compilation.errors', [])
    console.log(config.entry, config.output, pkg.theme, error);
  });
}
