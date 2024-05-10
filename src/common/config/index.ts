import { Logger } from "@/utils";
import * as yaml from "yaml";
import { existsSync, readFileSync, statSync } from "fs";
import { extname, join } from "path";
import schema from "./schema";
import { get } from "lodash";
import { Package } from "../file";

export enum PACKAGE_TYPE {
  APP = "app",
  TEMPLATE = "template",
  H5 = "h5",
  WEB = "web",
}

export enum ENV {
  test = "test",
  production = "production",
  development = "development",
}

export interface Builder {
  type: PACKAGE_TYPE;
  main: string;
}

export interface IPackage {
  name: string;
  source: string;
  builder: Builder[];
}

export interface Common {
  name: string;
  source: string;
  main?: string;
}

export interface IConfig {
  theme?: string;
  public?: string;
  package: IPackage[];
  common: Common[];
}

export interface PackageInfo extends Omit<IPackage, "builder"> {
  zip: string;
  theme?: string;
  public?: string;
  version: string;
  hash: string;
  main: string;
  output: string;
  type: PACKAGE_TYPE;
}

export interface IConfigOptions {
  env?: ENV;
  credential?: string;
}

export default class Config {
  constructor(
    private readonly file: string,
    private readonly options: IConfigOptions = {}
  ) {
    this.data = this.checkFile(join(process.cwd(), this.file));
  }
  private data!: IConfig;
  private checkFile(file: string): IConfig {
    const stat = statSync(file);
    if (!existsSync(file)) Logger.error("配置文件不存在");
    if (!stat.isFile()) Logger.error("路径不是文件");
    if (!this.isYaml(file)) Logger.error("配置文件不是一下格式:yaml、yml");
    const data = readFileSync(file).toString();
    const yamlData = yaml.parse(data);
    const { value, error } = schema.validate(yamlData, {
      convert: false,
    });
    const message = get(error, "details.0.message");
    if (message) Logger.error(message);
    return value;
  }

  private checkTheme(theme?: string) {
    const root = process.cwd();
    if (theme) {
      const themePath = join(root, theme);
      if (existsSync(themePath) && statSync(themePath).isFile()) {
        return themePath;
      }
    }
  }

  private checkTemplate(template?: string) {
    const root = process.cwd();
    if (template) {
      const themePath = join(root, template);
      if (existsSync(themePath) && statSync(themePath).isFile()) {
        return template;
      }
    }
  }

  private checkPublic(publicDir?: string) {
    const root = process.cwd();
    if (publicDir) {
      const asset = join(root, publicDir);
      const assetState = statSync(asset);
      if (existsSync(asset) && assetState.isDirectory()) {
        return asset;
      }
    }
  }

  private parsePackage(data: IPackage) {
    try {
      const root = process.cwd();
      const pkgDir = join(root, data.source);
      const buildDir = join(root, ".builder");
      const zipDir = join(root, ".zip");
      const pkgJson = join(root, data.source, "package.json");
      const pkgStat = statSync(pkgDir);
      if (!pkgStat.isDirectory())
        throw new Error(`${data.name} - source 不是文件夹`);
      if (!existsSync(pkgDir)) throw new Error(`${data.name} - source 不存在`);
      if (!existsSync(pkgJson))
        throw new Error(`${data.name} - ${pkgJson} 不存在`);
      const { version } = require(pkgJson);
      if (!version)
        throw new Error(`${data.name} - package.json 中缺少version字段`);
      return data.builder
        .map((item) => {
          const main = join(pkgDir, item.main);
          if (!existsSync(main)) return undefined;
          const itemBuildDir = join(buildDir, `${data.name}/${item.type}`);
          const itemZipDir = join(zipDir, `${data.name}/${item.type}`);
          const stat = statSync(main);
          if (!stat.isFile()) return undefined;
          const pkg: PackageInfo = {
            name: data.name,
            source: pkgDir,
            type: item.type,
            output: itemBuildDir,
            zip: itemZipDir,
            hash: "",
            main,
            version,
          };
          pkg.public = this.checkPublic(this.data.public);
          pkg.theme = this.checkTheme(this.data.theme);
          return pkg;
        })
        .filter(Boolean);
    } catch (error) {
      Logger.wran(error.message);
      return [];
    }
  }

  private parseCommon(data: Common) {
    try {
      const root = process.cwd();
      const source = join(root, data.source);
      const main = data.main ? join(source, data.main) : source;
      const statSource = statSync(source);
      if (!existsSync(source)) throw new Error(`${data.name} - source 不存在`);
      if (!statSource.isDirectory())
        throw new Error(`${data.name} - source 不是文件夹`);
      if (!existsSync(main)) throw new Error(`${data.name} - main 不存在`);
      return {
        ...data,
        main,
        source,
      };
    } catch (error) {
      Logger.wran(error.message);
      return undefined;
    }
  }

  public isYaml(file: string) {
    const name = extname(file);
    return [".yaml", ".yml"].includes(name);
  }

  get env(): ENV {
    return get(this.options, "env", ENV.production);
  }

  get packages(): Package[] {
    const credential = get(this.options, "credential", "");
    return this.data.package
      .reduce((pre, item) => pre.concat(this.parsePackage(item)), [])
      .map((item) => new Package(item, this, credential));
  }
  get commons(): Common[] {
    const _commons = get(this.data, "common", []);
    return _commons.map((item) => this.parseCommon(item)).filter(Boolean);
  }
}
