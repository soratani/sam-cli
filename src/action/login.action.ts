import { get } from "lodash";
import { Input } from "@/command";
import { Logger, api, setCredential } from "@/utils";
import { AbstractAction } from "@/action";

export class LoginAction extends AbstractAction {
  public async handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[]
  ): Promise<void> {
    const account = options.find((o) => o.name === "account")?.value as string;
    const password = options.find((o) => o.name === "password")
      ?.value as string;
    if (!account) Logger.error("请输入账号");
    if (!password) Logger.error("请输入密码");
    Logger.info("开始登录");
    try {
      const data = await api.post("/auth/login", { account, password });
      const token = get(data, "data.token", "");
      Logger.info(`TOKEN: ********`);
      const res = await api.post("/auth/credential", undefined, {
        headers: { authorization: `Bearer ${token}` },
      });
      const credential = get(res, "data", "");
      Logger.info(`令牌: ********`);
      setCredential(credential);
      Logger.info("登录成功");
    } catch (error) {
      Logger.error("登录异常");
    }
  }
}
