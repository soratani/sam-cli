import { execFile } from "child_process";
import { join } from "path";

interface IParams {
  credential: string;
  host?: string;
  [key: string]: any;
}

export default function run(cmd: string, params: IParams) {
  if (["login", "download", "upload"].includes(cmd))
    return Promise.reject("cmd 错误");
  const { credential, host, ..._params } = params;
  const args = Object.entries(_params)
    .filter((item) => !!item[1])
    .reduce(
      (pre: string[], item) => {
        return pre.concat([`--${item[0]}`, item[1]]);
      },
      [join(__dirname, "cli.js"), cmd]
    );
  return new Promise<boolean>((resolve, reject) => {
    execFile(
      process.execPath,
      args,
      {
        env: { CREDENTIAL: credential, HOST: host },
        cwd: process.cwd(),
        shell: false,
      },
      (error, stdout) => {
        if (error) {
          reject(error.message);
        } else {
          console.log(stdout);
          resolve(true);
        }
      }
    );
  });
}
