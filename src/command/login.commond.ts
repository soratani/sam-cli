import { Command } from "commander";
import { get } from "lodash";
import { AbstractCommand, Input } from "@/command";

export class LoginCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("login")
      .description("登录")
      .option("-a, --account [account]", "账号")
      .option("-p, --password [password]", "密码")
      .action(async (commond: Command) => {
        const account = get(commond, "account");
        const password = get(commond, "password");
        const inputs: Input[] = [];
        const options: Input[] = [];
        options.push({
          name: "account",
          value: account,
        });
        options.push({
          name: "password",
          value: password,
        });
        await this.action.handle(inputs, options);
      });
  }
}
