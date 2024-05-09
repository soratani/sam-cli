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

export class StartAction extends AbstractAction {
  private checkPackages(
    pkgs: IPackage[],
    theme?: string,
    publicPath?: string
  ): PackageInfo[] {
    if (!pkgs || !pkgs.length) Logger.error("配置错误");
    const info = pkgs.reduce<PackageInfo[]>(
      (pre, item) => pre.concat(parsePackage(item, theme, publicPath)),
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
    const pkg = options.find((o) => o.name === "package")?.value as string;
    try {
      const configData = this.config(config);
      const pkgs = get(configData, "package") as IPackage[];
      const packages = pkg ? pkgs.filter((item) => item.name === pkg) : pkgs;
      const commons = get(configData, "common") as Common[];
      const theme = get(configData, "theme");
      const publicPath = get(configData, "public");
      const commonInfo = this.checkCommons(commons);
      const info = this.checkPackages(packages, theme, publicPath);
      const data = info.map((item) => new Package(item, ""));
      Logger.info("准备启动");
      await Package.startAll(data, commonInfo);
    } catch (error) {
      Logger.error(error.message);
    }
  }
}
