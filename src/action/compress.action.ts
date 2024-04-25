import { get } from "lodash";
import { join } from "path";
import { createReadStream, readdirSync, statSync } from "fs";
import FormData from "form-data";
import { Input } from "../command";
import { AbstractAction } from "./abstract.action";
import { Logger } from "../ui/logger";
import { IPackage, zip } from "../common/file";
import api, { IRes } from "../utils/api";

export class CompressAction extends AbstractAction {
  private async zipPackage(inputPath: string, outputPath: string) {
    const dirs = readdirSync(inputPath)
      .map((item) => join(inputPath, item))
      .filter((item) => statSync(item).isDirectory());
    const res = await Promise.all(dirs.map((item) => zip(item, outputPath)));
    return res.filter((i) => !!i);
  }

  private async zipApp(inputPath: string, outputPath: string) {
    const file = await zip(inputPath, outputPath);
    return [file].filter((i) => !!i);
  }

  private async uploadPackage(name: string, verions: string, file: string) {
    const formdata = new FormData();
    formdata.append("file", createReadStream(file));
    formdata.append("version", verions);
    return api.post<any, IRes>(`/package/update/${name}`, formdata, {
      headers: { ...formdata.getHeaders() },
    });
  }

  private async uploadPackages(packages: IPackage[]) {
    return Promise.all(
      packages.map((item) =>
        this.uploadPackage(item.name, item.version, item.file)
      )
    ).then((value: IRes[]) => value.filter((i) => i.code === 1));
  }

  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as string;
    const type = options.find((o) => o.name === "type")?.value as string;
    if (!["package", "app"].includes(type)) return Logger.error("打包类型错误");
    try {
      const configData = this.config(config);
      const { input, output } = get(configData, "package");
      const inputPath = join(process.cwd(), input);
      const outputPath = join(process.cwd(), output);
      let files: IPackage[];
      if (type == "app") {
        files = await this.zipApp(inputPath, outputPath);
      } else {
        files = await this.zipPackage(inputPath, outputPath);
      }
      if (!files.length) Logger.error("压缩失败");
      Logger.info("准备上传");
      await this.uploadPackages(files);
      Logger.info("上传资源包完毕");
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
