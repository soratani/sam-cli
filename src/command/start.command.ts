import { Command } from "commander";
import { get } from "lodash";
import { AbstractCommand, Input } from "@/command";

export class StartCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("start")
      .description("启动")
      .option("-p, --package [package]", "启动的项目")
      .option("-c, --config [config]", "配置文件", "sam.yaml")
      .action(async (command: Command) => {
        const config = get(command, "config");
        const packages = get(command, "package");
        const inputs: Input[] = [];
        const options: Input[] = [];
        options.push({
          name: "config",
          value: config,
        });
        options.push({
          name: "package",
          value: packages,
        });
        await this.action.handle(inputs, options);
      });
  }
}
