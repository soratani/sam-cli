import { Command } from "commander";
import { Logger } from "@/ui/logger";
import { DownloadCommand, UploadCommand, CompressCommand, LoginCommand } from "@/command";
import {
  CompressAction,
  DownloadAction,
  LoginAction,
  UploadAction,
} from "@/action";

export class CommandLoader {
  public static load(program: Command): void {
    new DownloadCommand(new DownloadAction()).load(program);
    new UploadCommand(new UploadAction()).load(program);
    new CompressCommand(new CompressAction()).load(program);
    new LoginCommand(new LoginAction()).load(program);
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
