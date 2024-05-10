import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger } from "@/utils";
import { Package } from "@/common/file";
import Config from "@/common/config";

export class CompressAction extends AbstractAction {
  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as Config;
    const app = options.find((o) => o.name === "app")?.value as string;
    try {
      Logger.info("准备打包");
      if (app) {
        const pkg = config.packages.find((item) => item.name == app);
        if (!pkg) throw new Error("打包异常");
        await pkg.build();
        Logger.info("准备上传");
        const task = await pkg.sync();
        if (task.code !== 1) {
          Logger.error(task.message);
        }
        return Logger.info("上传资源包完毕");
      }
      await Package.buildAll(config.packages);
      Logger.info("准备上传");
      const task = await Package.syncAll(config.packages);
      if (task.code !== 1) {
        Logger.error(task.message);
      }
      Logger.info("上传资源包完毕");
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
