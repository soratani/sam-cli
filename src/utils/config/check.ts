import { get } from "lodash";
import { extname, join } from "path";
import { Logger } from "../logger";
import schema from "./schema";
import { Common, IConfig, IPackage, PackageInfo } from "./type";
import { existsSync, stat, statSync } from "fs";

function checkPublic(publicDir?: string) {
  const root = process.cwd();
  if (publicDir) {
    const asset = join(root, publicDir);
    const assetState = statSync(asset);
    if (existsSync(asset) && assetState.isDirectory()) {
      return asset;
    }
  }
}

function checkTheme(theme?: string) {
  const root = process.cwd();
  if (theme) {
    const themePath = join(root, theme);
    if (existsSync(themePath) && statSync(themePath).isFile()) {
      return themePath;
    }
  }
}

function checkTemplate(template?: string) {
  const root = process.cwd();
  if (template) {
    const themePath = join(root, template);
    if (existsSync(themePath) && statSync(themePath).isFile()) {
      return template;
    }
  }
}

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

export function parsePackage(
  data: IPackage,
  theme?: string,
  publicDir?: string
): PackageInfo[] {
  try {
    const root = process.cwd();
    const pkgDir = join(root, data.source);
    const buildDir = join(root, ".builder");
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
      Logger.wran(`${data.name} - ${pkgJson} 不存在`);
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
        const template = checkTemplate(item.template);
        if (!stat.isFile() || !template) return undefined;
        const pkg: PackageInfo = {
          name: data.name,
          source: pkgDir,
          type: item.type,
          output: itemBuildDir,
          zip: itemZipDir,
          template: template,
          hash: "",
          main,
          version,
        };
        pkg.public = checkPublic(publicDir);
        pkg.theme = checkTheme(theme);
        return pkg;
      })
      .filter(Boolean);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export function parseCommon(data: Common): Common | void {
  const root = process.cwd();
  const source = join(root, data.source);
  const main = data.main ? join(source, data.main) : source;
  const statSource = statSync(source);
  if (!existsSync(source)) return Logger.wran(`${data.name} - source 不存在`);
  if (!statSource.isDirectory())
    return Logger.wran(`${data.name} - source 不是文件夹`);
  if (!existsSync(main)) return Logger.wran(`${data.name} - main 不存在`);
  return {
    ...data,
    main,
    source,
  };
}