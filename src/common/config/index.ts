import { Logger } from "@/utils";
import * as yaml from "yaml";
import { existsSync, readFileSync, statSync } from "fs";
import { extname, join } from "path";
import schema from "./schema";
import { get } from "lodash";
import { App } from "../file";

export enum APPTYPE {
  TEMPLATE, // 模版
  APP, // app
  H5, // h5
  WEB, // web
  OUTHER, // 其他
}

export const packageTypeMap = {
  app: APPTYPE.APP,
  template: APPTYPE.TEMPLATE,
  h5: APPTYPE.H5,
  web: APPTYPE.WEB,
  outher: APPTYPE.OUTHER,
};

export enum ENV {
  test = "test",
  production = "production",
  development = "development",
}

export interface IProxy {
  path: string;
  target: string;
}

export interface IPackageJson {
  name: string;
  version: string;
  source: string
  main: string;
}

export interface IApplication {
  name: string;
  builder: APPTYPE[];
  proxy?: IProxy[];
  environment?: string;
}

export interface IConfig {
  theme?: string;
  public?: string;
  apps: IApplication[];
  packages: string[];
}

export interface ApplicationInfo extends Omit<IApplication, "builder"> {
  zip: string;
  theme?: string;
  public?: string;
  version: string;
  hash: string;
  root: string;
  main: string;
  output: string;
  env: string;
  envFile?: string;
  type: APPTYPE;
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


  private packageInfo(cwd: string): IPackageJson {
    const filepath = join(cwd, 'package.json');
    if (!existsSync(cwd)) Logger.error('app文件夹不存在');
    if (!existsSync(filepath)) Logger.error('解析包信息出错');
    try {
      const data = readFileSync(join(cwd, 'package.json'), { encoding: 'utf-8' }).toString();
      return JSON.parse(data);
    } catch (error) {
      Logger.error('解析包信息出错')
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

  private checkEnvironment(data: IApplication) {
    const root = process.cwd();
    const appDir = join(root, 'apps', data.name);
    if(!data.environment) return undefined;
    const envPath = join(appDir, data.environment);
    if (!existsSync(envPath)) return undefined;
    if (statSync(envPath).isDirectory()) {
      const _path = join(envPath, `${this.env}.env`);
      return existsSync(_path) ? _path : undefined;
    }
    if (statSync(envPath).isFile() && extname(envPath) === '.env') return envPath;
    return undefined;
  }

  private parseApp(data: IApplication) {
    try {
      const root = process.cwd();
      const appDir = join(root, 'apps', data.name);
      const pkgInfo = this.packageInfo(appDir);
      const source = get(pkgInfo, 'source');
      const version = get(pkgInfo, 'version');
      const buildDir = join(root, ".builder");
      const zipDir = join(root, ".zip");
      const proxy = get(data, "proxy", []);
      if (!version)
        Logger.error(`${data.name} - package.json 中缺少version`);
      if (!source) Logger.error(`${data.name} - package.json 中缺少source `)
      return data.builder
        .map((item) => {
          const main = join(appDir, source);
          const envFile = join(appDir, data.environment);
          const type = packageTypeMap[item];
          if (!existsSync(main)) return undefined;
          const itemBuildDir = join(buildDir, `${data.name}/${item}`);
          const itemZipDir = join(zipDir, `${data.name}/${item}`);
          const stat = statSync(main);
          if (!stat.isFile()) return undefined;
          const pkg: ApplicationInfo = {
            name: data.name,
            output: itemBuildDir,
            zip: itemZipDir,
            root: appDir,
            env: item as unknown as string,
            envFile: this.checkEnvironment(data),
            type,
            proxy,
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

  private parsePackage(data: string): IPackageJson | void {
    try {
      const root = process.cwd();
      const pkgDir = join(root,'packages', data);
      if (!existsSync(pkgDir)) return undefined;
      const pkgJson = this.packageInfo(pkgDir);
      if (!pkgJson.source) return Logger.wran(`包${pkgJson.name}缺少入口`);
      const main = join(pkgDir, pkgJson.source);
      if (!existsSync(main)) return Logger.wran(`包${pkgJson.name}缺少入口`);
      return { ...pkgJson, source: main}
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

  get credential(): string {
    return get(this.options, "credential", "");
  }

  get apps(): App[] {
    return this.data.apps
      .reduce((pre, item) => pre.concat(this.parseApp(item)), [])
      .map((item) => new App(item, this));
  }

  get packages(): IPackageJson[] {
    return this.data.packages.reduce((pre, item) => pre.concat(this.parsePackage(item)), []).filter(Boolean);
  }
}
