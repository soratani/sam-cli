import {
  INFO_PREFIX,
  IPkg,
  IRes,
  Logger,
  PACKAGE_TYPE,
  api,
  createPackageHash,
  createTask,
} from "@/utils";
import FormData from "form-data";
import { join } from "path";
import { createReadStream } from "fs";
import { zip } from "./compress";
import { IPackage, PackageInfo } from "@/utils/config";

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
    const { type, zip, name, version } = pkg;
    const formdata = new FormData();
    formdata.append("file", createReadStream(zip));
    formdata.append("code", name);
    formdata.append("version", version);
    formdata.append("type", type);
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

  constructor(
    private readonly option: PackageInfo,
    private readonly credential: string
  ) {
    this.hash = this.hash.bind(this);
    this.compress = this.compress.bind(this);
    this.sync = this.sync.bind(this);
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
    const { name, version, type } = pkg;
    const URL = `/package/add_package`;
    const params = Package.params(pkg);
    const config = {
      headers: { ...params.getHeaders(), credential: this.credential },
    };
    const task = createTask(
      "bouncingBar",
      `\n${INFO_PREFIX}`,
      Logger.baseText(`上传中 ${type}:${name}-${version}`)
    );
    Logger.info(`准备上传 ${type} ${name}-${version}`);
    task.start();
    return api
      .post<any, IRes>(URL, params, config)
      .then((res) => {
        task.succeed(Logger.infoText(`上传完成 ${type}:${name}-${version}`));
        return res;
      })
      .catch(() => {
        task.fail(Logger.errorText(`上传失败 ${type}:${name}-${version}`));
        return { code: 500, message: "" };
      });
  }

  async build() {
    Logger.info(`开始打包 ${this.option.name}:${this.option.version}`);
  }
}
