import { Logger } from "../../ui/logger";
import { ClientOption, setupClient } from "./client";
import { uploadFile } from "./upload";

interface Assets {
  local: string,
  remote: string,
}

export async function sshUpload(assets: Assets[], option: ClientOption[], status: boolean[] = []): Promise<boolean> {
  if (!option.length) return status.every((s) => !!s);
  const client = option.shift();
  const ssh = await setupClient(client);
  if (!ssh) return sshUpload(assets, option, [...status, false]);
  Logger.info(`开始上传资源到${client.host}`);
  let statu: boolean;
  try {
    statu = await Promise.all(assets.map((item) => uploadFile(ssh, item.local, item.remote))).then((val) => val.every(i => !!i));
    Logger.info(`资源上传到${client.host}成功`);
  } catch (error) {
    statu = false;
    Logger.wran(`资源上传到${client.host}失败`);
  }
  ssh.end();
  return sshUpload(assets, option, [...status, statu]);
}