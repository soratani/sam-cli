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
import { IPackage, zip } from "./compress";

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

  static params(pkg: IPackage) {
    const { type, file, name, version } = pkg;
    return type.map((item) => {
      const formdata = new FormData();
      formdata.append("file", createReadStream(file));
      formdata.append("code", name);
      formdata.append("version", version);
      formdata.append("type", item);
      return formdata;
    });
  }

  static syncAll(packages: Package[]) {
    return packages.reduce((pre: Promise<IRes>, item) => {
      return pre.then(() => item.sync());
    }, Promise.resolve({ code: 500, message: "" }));
  }

  constructor(
    private readonly option: IPkg,
    private readonly credential: string
  ) {
    this.hash = this.hash.bind(this);
    this.compress = this.compress.bind(this);
    this.sync = this.sync.bind(this);
  }

  get data() {
    return {
      ...this.option,
      input: join(process.cwd(), this.option.input),
      output: join(process.cwd(), this.option.output),
      json: join(process.cwd(), this.option.json),
    };
  }

  hash() {
    return createPackageHash(this.data.input);
  }

  async compress() {
    try {
      const hash = await this.hash();
      return await zip({ ...this.data, hash });
    } catch (error) {
      Logger.error(`${this.data.name}压缩失败`);
      return undefined;
    }
  }

  async sync() {
    const pkg = await this.compress();
    if (!pkg) return { code: 500, message: "" };
    const { name, version, type } = pkg;
    const URL = `/package/add_package`;
    const params = Package.params(pkg);
    const task = createTask(
      "bouncingBar",
      `\n${INFO_PREFIX}`,
      Logger.baseText(`上传中 ${type}:${name}-${version}`)
    );
    Logger.info(`准备上传 ${type} ${name}-${version}`);
    task.start();
    return Promise.all(
      params.map((item) => {
        const config = {
          headers: { ...item.getHeaders(), credential: this.credential },
        };
        return api.post<any, IRes>(URL, item, config);
      })
    )
      .then(([res]) => {
        task.succeed(Logger.infoText(`上传完成 ${type}:${name}-${version}`));
        return res;
      })
      .catch(() => {
        task.fail(Logger.errorText(`上传失败 ${type}:${name}-${version}`));
        return { code: 500, message: "" };
      });
  }
}
