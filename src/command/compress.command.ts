import { Command } from "commander";
import { get } from "lodash";
import { AbstractCommand, Input } from "@/command";
import Config from "@/common/config";

export class CompressCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("compress")
      .description("压缩文件")
      .option(
        "-e, --env [env]",
        "压缩环境:[test,production,development]",
        "production"
      )
      .option("-a, --app [app]", "项目")
      .option("-c, --config [config]", "配置文件", "sam.yaml")
      .option("-cr, --credential [credential]", "鉴权")
      .action(async (command: Command) => {
        const config = get(command, "config");
        const credential = get(command, "credential");
        const app = get(command, "app");
        const env = get(command, "env");
        const instance = new Config(config, { credential, env });
        const inputs: Input[] = [];
        const options: Input[] = [];
        options.push({
          name: "app",
          value: app,
        });
        options.push({
          name: "config",
          value: instance,
        });
        await this.action.handle(inputs, options);
      });
  }
}
