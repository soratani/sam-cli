import { Command } from "commander";
import { get } from "lodash";
import { AbstractCommand, Input } from "@/command";
import Config from "@/common/config";

export class BuildCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("build [app]")
      .description("打包")
      .option(
        "-e, --env [env]",
        "打包环境:[test,production,development]",
        "production"
      )
      .option("-c, --config [config]", "配置文件", "sam.yaml")
      .action(async (app: string, command: Command) => {
        const inputs: Input[] = [];
        const options: Input[] = [];
        const config = get(command, "config");
        const env = get(command, "env");
        const instance = new Config(config, { env });
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
