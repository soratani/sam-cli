import {
  INFO_PREFIX,
  IRes,
  Logger,
  api,
  createPackageHash,
  createTask,
} from "@/utils";
import FormData from "form-data";
import { createReadStream } from "fs";
import { zip } from "./compress";
import run from "../webpack/run";
import start from "../webpack/server";
import Config, { PACKAGE_TYPE, PackageInfo } from "../config";
import { ProxyConfigArrayItem } from "webpack-dev-server";

export class Package {
  static syncType(type: PACKAGE_TYPE) {
    const map = {
      server: [PACKAGE_TYPE.H5, PACKAGE_TYPE.WEB],
      cos: [PACKAGE_TYPE.APP, PACKAGE_TYPE.TEMPLATE],
    };
    return Object.entries(map)
      .filter(([, keys]) => keys.includes(type))
      .map(([key]) => key);
  }

  static params(pkg: PackageInfo) {
    const { type, zip, name, hash, version } = pkg;
    const formdata = new FormData();
    formdata.append("file", createReadStream(zip));
    formdata.append("code", name);
    formdata.append("version", version);
    formdata.append("type", type);
    formdata.append("hash", hash);
    return formdata;
  }

  static syncAll(packages: Package[]) {
    return packages.reduce((pre: Promise<IRes>, item) => {
      return pre.then(() => item.sync());
    }, Promise.resolve({ code: 500, message: "" }));
  }

  static buildAll(packages: Package[]) {
    return packages.reduce((pre: Promise<IRes>, item) => {
      return pre.then(() => item.build());
    }, Promise.resolve({ code: 500, message: "" }));
  }

  static startAll(packages: Package[]) {
    return packages.reduce((pre: Promise<IRes>, item) => {
      return pre.then(() => item.start());
    }, Promise.resolve({ code: 500, message: "" }));
  }

  constructor(
    private readonly option: PackageInfo,
    private readonly config: Config,
    private readonly credential: string
  ) {
    this.hash = this.hash.bind(this);
    this.compress = this.compress.bind(this);
    this.sync = this.sync.bind(this);
  }

  get proxy(): ProxyConfigArrayItem[] {
    const data = this.option.proxy;
    const targets = Array.from(new Set(data.map(item => item.target)));
    return targets.reduce((pre, item) => {
      const context = data.filter((i) => i.target === item).map(i => i.path);
      return pre.concat([{ context, target: item, changeOrigin: true }]);
    },[] as ProxyConfigArrayItem[]);
  }

  get name() {
    return this.option.name;
  }

  get version() {
    return this.option.version;
  }

  hash() {
    return createPackageHash(this.option.output);
  }

  async compress() {
    try {
      const hash = await this.hash();
      return await zip({ ...this.option, hash });
    } catch (error) {
      Logger.error(`${this.option.name}压缩失败`);
      return undefined;
    }
  }

  async sync() {
    const pkg = await this.compress();
    if (!pkg) return { code: 500, message: "" };
    const { name, version, zip } = pkg;
    const URL = `/upload/base/package`;
    const params = Package.params(pkg);
    const config = {
      headers: { ...params.getHeaders(), credential: this.credential },
    };
    Logger.info('准备上传')
    Logger.info(`名称:${name}`);
    Logger.info(`版本:${version}`);
    Logger.info(`文件:${zip}`);
    const task = createTask("bouncingBar",`${INFO_PREFIX}`,Logger.infoText('上传中......'));
    task.start();
    return api
      .post<any, IRes>(URL, params, config)
      .then((res) => {
        task.succeed(Logger.infoText('上传完成'));
        return res;
      })
      .catch(() => {
        task.fail(Logger.errorText(`上传失败`));
        return { code: 500, message: "" };
      });
  }

  async build() {
    const { name, type, version } = this.option;
    Logger.info('开始打包');
    Logger.info(`环境:${this.config.env}`);
    Logger.info(`名称:${name}`);
    Logger.info(`类型:${type}`);
    Logger.info(`版本:${version}`);
    const task = createTask("dots",INFO_PREFIX,`打包中...`);
    try {
      task.start();
      await run(this.option, this.config);
      task.succeed('打包成功');
    } catch (error) {
      console.log(error);
      task.fail('打包失败');
    }
  }

  async start() {
    const { name, type, version } = this.option;
    Logger.info('开始启动');
    Logger.info(`环境:${this.config.env}`);
    Logger.info(`名称:${name}`);
    Logger.info(`类型:${type}`);
    Logger.info(`版本:${version}`);
    const task = createTask("dots",INFO_PREFIX,`启动中...`);
    try {
      task.start();
      const server = await start(this.option, this.config, this.proxy);
      task.succeed("启动成功");
      Logger.info(`地址: http://${server.host}:${server.port}`)
    } catch (error) {
      console.log(error);
      task.fail('启动失败');
    }
  }
}
