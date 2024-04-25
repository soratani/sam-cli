import { execFile } from "child_process";
import { join } from "path";

interface IParams {
  credential: string;
  [key: string]: any;
}

export default function run(cmd: string, params: IParams) {
  const { credential, ..._params } = params;
  const args = Object.entries(_params)
    .filter((item) => !!item[1])
    .reduce(
      (pre: string[], item) => {
        return pre.concat([`--${item[0]}`, item[1]]);
      },
      [process.execPath, join(__dirname, "cli.js"), cmd]
    );

  return new Promise<boolean>((resolve, reject) => {
    execFile(
      process.execPath,
      args,
      { env: { CREDENTIAL: credential }, shell: false },
      (error, stdout, stderr) => {
        if (error || stderr) {
          reject(error.message || stderr.toString());
        } else {
          resolve(true);
        }
      }
    );
  });
}
