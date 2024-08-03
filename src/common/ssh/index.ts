import Client from "ssh2-sftp-client";
import * as glob from "glob";
import { join } from "path";
import { statSync } from "fs";
import { Logger } from "../../utils/logger";

export default class Ssh extends Client {
  constructor() {
    super();
  }

  private create(options: Client.ConnectOptions) {
    return this.connect(options)
      .catch(() => {
        Logger.wran(`${options.host}链接失败`);
        return false;
      })
      .then(() => true);
  }

  private async check(local: string, remote: string) {
    const paths = glob.sync(join(local, "**/*"), { ignore: [] });
    const dirs = paths.filter((f) => statSync(f).isDirectory());
    return await Promise.all(
      dirs.map(async (d) => {
        try {
          await this.mkdir(d.replace(local, remote), true);
          Logger.info(`成功在服务器创建文件夹:${d.replace(local, remote)}`);
          return true;
        } catch (error) {
          Logger.wran(`在服务器创建文件夹失败:${d.replace(local, remote)}`);
          return false;
        }
      })
    ).then((v) => v.every((i) => !!i));
  }

  private async uploadFiles(
    local: string,
    remote: string,
    index: number,
    count: number,
    files: string[],
    error: string[]
  ): Promise<string[]> {
    if (!files.length) return error;
    const file = files.shift();
    const percent = parseInt(((index / count) * 100) as any);
    const message = `[${index}/${count}, ${percent}%]: ${file.replace(
      local,
      ""
    )}`;
    return this.fastPut(file, file.replace(local, remote))
      .then(() => {
        Logger.info(message);
        return this.uploadFiles(local, remote, index + 1, count, files, error);
      })
      .catch(() => {
        Logger.wran(message);
        return this.uploadFiles(local, remote, index + 1, count, files, [
          ...error,
          file,
        ]);
      });
  }

  private getFiles(local: string) {
    const paths = glob.sync(join(local, "**/*"), { ignore: [] });
    return paths.filter((f) => statSync(f).isFile());
  }

  async upload(
    local: string,
    remote: string,
    option: Pick<Client.ConnectOptions, "username" | "password" | "host">
  ) {
    const status = await this.create(option);
    const isDir = statSync(local).isDirectory();
    if (isDir) {
      const files = this.getFiles(local);
      if (!status) return files;
      await this.check(local, remote);
      return await this.uploadFiles(local, remote, 1, files.length, files, []);
    } else {
      const localPaths = local.split("/");
      if (!status) return [local];
      return await this.uploadFiles(
        localPaths.slice(0, localPaths.length - 1).join("/"),
        remote,
        1,
        1,
        [local],
        []
      );
    }
  }
}
