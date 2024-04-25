import { get } from "lodash";
import { join } from "path";
import { createReadStream, statSync } from "fs";
import FormData from "form-data";
import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger, api, IRes, IPkg  } from "@/utils";
import { IPackage, zip } from "@/common/file";

export class CompressAction extends AbstractAction {
  private async zipPackage(packages: IPkg[]) {
    const dirs = packages
      .map((item) => ({
        ...item,
        input: join(process.cwd(), item.input),
        output: join(process.cwd(), item.output),
        json: join(process.cwd(), item.json),
      }))
      .filter(
        (item) =>
          statSync(item.input).isDirectory() &&
          statSync(item.output) &&
          statSync(item.json).isFile()
      );
    const res = await Promise.all(
      dirs.map((item) => zip(item.name, item.json, item.input, item.output))
    );
    return res.filter((i) => !!i);
  }

  private async uploadPackage(name: string, verions: string, file: string) {
    const formdata = new FormData();
    formdata.append("file", createReadStream(file));
    formdata.append("version", verions);
    return api.put<any, IRes>(`/package/update/${name}`, formdata, {
      headers: { ...formdata.getHeaders() },
    });
  }

  private async uploadPackages(packages: IPackage[]) {
    return Promise.all(
      packages.map((item) =>
        this.uploadPackage(item.name, item.version, item.file)
      )
    ).then((value: IRes[]) => value.filter((i) => i.code !== 1));
  }

  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as string;
    try {
      const configData = this.config(config);
      const pkgs = get(configData, "packages") as IPkg[];
      if (!pkgs || !pkgs.length) return Logger.error("配置错误");
      const files: IPackage[] = await this.zipPackage(pkgs);
      if (!files.length) Logger.error("压缩失败");
      Logger.info("准备上传");
      const [task] = await this.uploadPackages(files);
      if (task) {
        Logger.error(task.message);
      }
      Logger.info("上传资源包完毕");
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
