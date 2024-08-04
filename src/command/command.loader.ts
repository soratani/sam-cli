import { Command } from "commander";
import { Logger } from "@/utils";
import {
  BuildCommand,
  PublishCommand,
  LoginCommand,
  StartCommand,
} from "@/command";
import {
  BuildAction,
  PublishAction,
  LoginAction,
  StartAction,
} from "@/action";

export class CommandLoader {
  public static load(program: Command): void {
    new PublishCommand(new PublishAction()).load(program);
    new LoginCommand(new LoginAction()).load(program);
    new BuildCommand(new BuildAction()).load(program);
    new StartCommand(new StartAction()).load(program);
    this.handleInvalidCommand(program);
  }

  private static handleInvalidCommand(program: Command) {
    program.on("command:*", () => {
      Logger.error("未知命令: %s", program.args.join(" "));
      Logger.info("有关可用命令的列表，请参见 --help.\n");
      process.exit(1);
    });
  }
}
