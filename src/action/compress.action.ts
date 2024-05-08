import { get } from "lodash";
import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger, IPkg } from "@/utils";
import { Package } from "@/common/file";

export class CompressAction extends AbstractAction {
  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as string;
    const credential = options.find((o) => o.name === "credential")
      ?.value as string;
    try {
      const configData = this.config(config);
      const pkgs = get(configData, "packages") as IPkg[];
      if (!pkgs || !pkgs.length) return Logger.error("配置错误");
      const data = pkgs.map((item) => new Package(item, credential));
      Logger.info("准备上传");
      const task = await Package.syncAll(data);
      if (task.code !== 1) {
        Logger.error(task.message);
      }
      Logger.info("上传资源包完毕");
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
