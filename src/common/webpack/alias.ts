import { get } from "lodash";
import { join } from "path";
import { ApplicationInfo, IPackageJson } from "@/common/config";

function createCommon(common: IPackageJson[]) {
  return common.reduce((pre, item) => {
    pre[item.name] = item.main;
    return pre;
  }, {});
}

function genKey(key: string) {
  if (key.endsWith("/*")) return key.replace("/*", "");
  if (key.endsWith("/")) return key.replace("/", "");
  return key;
}

function genValue(value: string) {
  if (value.endsWith("/*")) return value.replace("/*", "");
  if (value.endsWith("/")) return value.replace("/", "");
  return value;
}

export default function createAlias(pkg: ApplicationInfo, common: IPackageJson[]) {
  const commons = createCommon(common);
  const tsconfigPath = join(pkg.root, "tsconfig.json");
  const tsconfig = require(tsconfigPath);
  const paths = get(tsconfig, "compilerOptions.paths", {});
  return Object.entries(paths).reduce((pre, item) => {
    const key = genKey(get(item, "0"));
    const value = join(pkg.root, genValue(get(item, "1.0")));
    pre[key] = value;
    return pre;
  }, commons);
}
