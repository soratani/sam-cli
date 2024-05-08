import { get } from "lodash";
import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger } from "@/utils";
import {
  Common,
  IPackage,
  PackageInfo,
  parseCommon,
  parsePackage,
} from "@/utils/config";
import { Package } from "@/common/file";

export class BuildAction extends AbstractAction {
  private checkPackages(pkgs: IPackage[]): PackageInfo[] {
    if (!pkgs || !pkgs.length) Logger.error("配置错误");
    const info = pkgs.reduce<PackageInfo[]>(
      (pre, item) => pre.concat(parsePackage(item)),
      []
    );
    if (!info.length) Logger.error("package信息有误");
    return info;
  }
  private checkCommons(commons: Common[]): Common[] {
    if (!commons || !commons.length) return [];
    return commons.map((item) => parseCommon(item)).filter(Boolean) as Common[];
  }

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
      const pkgs = get(configData, "package") as IPackage[];
      const commons = get(configData, "common") as Common[];
      const commonInfo = this.checkCommons(commons);
      const info = this.checkPackages(pkgs);
      const data = info.map((item) => new Package(item, credential));
      Logger.info("准备打包");
      await Package.buildAll(data);
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
