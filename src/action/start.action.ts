import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger } from "@/utils";
import { Package } from "@/common/file";
import Config from "@/common/config";

export class StartAction extends AbstractAction {
  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const config = options.find((o) => o.name === "config")?.value as Config;
    const app = options.find((o) => o.name === "app")?.value as string;
    try {
      Logger.info("准备启动");
      if (app) {
        const pkg = config.apps.find((item) => item.name == app);
        if (!pkg) throw new Error("启动异常");
        return await pkg.start();
      }
      await Package.startAll(config.apps);
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
