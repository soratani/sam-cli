import { get } from "lodash";
import { extname, join } from "path";
import { Logger } from "../logger";
import schema from "./schema";
import { Common, IConfig, IPackage, PackageInfo } from "./type";
import { existsSync, stat, statSync } from "fs";

export function isYaml(file: string) {
  const name = extname(file);
  return [".yaml", ".yml"].includes(name);
}

export function checkConfig(config): IConfig {
  const { value, error } = schema.validate(config, {
    convert: false,
  });
  const message = get(error, "details.0.message");
  if (message) Logger.error(message);
  return value;
}

export function parsePackage(data: IPackage): PackageInfo[] {
  const root = process.cwd();
  const pkgDir = join(root, data.source);
  const buildDir = join(root, ".build");
  const zipDir = join(root, ".zip");
  const pkgJson = join(root, data.source, "package.json");
  const pkgStat = statSync(pkgDir);
  if (!pkgStat.isDirectory()) {
    Logger.wran(`${data.name} - source 不是文件夹`);
    return [];
  }
  if (!existsSync(pkgDir)) {
    Logger.wran(`${data.name} - source 不存在`);
    return [];
  }
  if (!existsSync(pkgJson)) {
    Logger.wran(`${data.name} - package.json 不存在`);
    return [];
  }
  const { version } = require(pkgJson);
  if (!version) {
    Logger.wran(`${data.name} - package.json 中缺少version字段`);
    return [];
  }
  return data.builder
    .map((item) => {
      const main = join(pkgDir, item.main);
      if (!existsSync(main)) return undefined;
      const itemBuildDir = join(buildDir, `${data.name}/${item.type}`);
      const itemZipDir = join(zipDir, `${data.name}/${item.type}`);
      const stat = statSync(main);
      if (!stat.isFile()) return undefined;
      return {
        name: data.name,
        source: pkgDir,
        type: item.type,
        output: itemBuildDir,
        zip: itemZipDir,
        hash: "",
        main,
        version,
      };
    })
    .filter(Boolean);
}

export function parseCommon(data: Common): Common | void {
  const root = process.cwd();
  const source = join(root, data.source);
  const main = join(source, data.main);
  const statSource = statSync(source);
  const statMain = statSync(main);
  if (!existsSync(source)) return Logger.wran(`${data.name} - source 不存在`);
  if (!statSource.isDirectory())
    return Logger.wran(`${data.name} - source 不是文件夹`);
  if (!existsSync(main)) return Logger.wran(`${data.name} - main 不存在`);
  if (!statMain.isFile()) return Logger.wran(`${data.name} - main 不是文件`);
  return {
    ...data,
    main,
    source,
  };
}