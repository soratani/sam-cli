import { Command } from "commander";
import { get } from "lodash";
import { AbstractCommand, Input } from "@/command";

export class BuildCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("build")
      .description("打包")
      .option("-c, --config [config]", "配置文件", "sam.yaml")
      .action(async (command: Command) => {
        const config = get(command, "config");
        const inputs: Input[] = [];
        const options: Input[] = [];
        options.push({
          name: "config",
          value: config,
        });
        await this.action.handle(inputs, options);
      });
  }
}
