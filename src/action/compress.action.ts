import { get } from "lodash";
import { join } from "path";
import { createReadStream, statSync } from "fs";
import FormData from "form-data";
import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger, api, IRes, IPkg, createPackageHash } from "@/utils";
import { IPackage, zip } from "@/common/file";

export class CompressAction extends AbstractAction {
  private async createHash(packages: IPkg[]): Promise<Required<IPkg>[]> {
    const dirs = packages
      .map((item) => {
        return {
          ...item,
          input: join(process.cwd(), item.input),
          output: join(process.cwd(), item.output),
          json: join(process.cwd(), item.json),
        };
      })
      .filter(
        (item) =>
          statSync(item.input).isDirectory() &&
          statSync(item.output) &&
          statSync(item.json).isFile()
      );
    return Promise.all(dirs.map((item) => createPackageHash(item.input)))
      .then((items) =>
        items.map((item, key) => {
          const pkg = dirs[key];
          Logger.info(`${pkg.name} hash: ${item}`);
          return { ...pkg, hash: item };
        })
      )
      .catch(() => {
        Logger.error("文件hash生成失败");
      }) as Promise<Required<IPkg>[]>;
  }

  private async zipPackage(packages: IPkg[]) {
    const data = await this.createHash(packages);
    const res = await Promise.all(data.map((item) => zip(item)));
    return res.filter((i) => !!i);
  }

  private async uploadPackage(tag: string, name: string, version: string, file: string, credential: string) {
    const formdata = new FormData();
    formdata.append("file", createReadStream(file));
    return api.post<any, IRes>(`/package/add/${tag}/${name}/${version}`, formdata, {
      headers: { ...formdata.getHeaders(), credential },
    });
  }

  private uploadPackages(tag: string, packages: IPackage[], credential: string) {
    return packages.reduce((pre: Promise<IRes>, item) => {
      return pre
        .then(() => this.uploadPackage(tag, item.name, item.version, item.file, credential))
        .catch(() => this.uploadPackage(tag, item.name, item.version, item.file, credential));
    }, Promise.resolve({ code: 500, message: "" }));
  }

  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as string;
    const tag = options.find((o) => o.name === "tag")?.value as string;
    const credential = options.find((o) => o.name === "credential")?.value as string;
    try {
      const configData = this.config(config);
      const pkgs = get(configData, "packages") as IPkg[];
      if (!pkgs || !pkgs.length) return Logger.error("配置错误");
      const files: IPackage[] = await this.zipPackage(pkgs);
      if (!files.length) Logger.error("压缩失败");
      Logger.info("准备上传");
      const task = await this.uploadPackages(tag, files, credential);
      if (task.code !== 1) {
        Logger.error(task.message);
      }
      Logger.info("上传资源包完毕");
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
