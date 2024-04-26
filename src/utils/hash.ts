// 生成文件hash
import { glob } from "glob";
import crypto from "crypto";
import path from "path";
import { readFileSync } from "fs";

export function createPackageHash(input: string) {
  const hash = crypto.createHash("sha256");
  return new Promise<string>((resolve, reject) => {
    glob("**/*", { cwd: input, nodir: true }, (err, files) => {
      if (err) {
        return reject(null);
      }
      files.forEach((file) => {
        const filePath = path.join(input, file);
        const data = readFileSync(filePath);
        hash.setEncoding("hex");
        hash.update(data);
      });
      const sha256 = hash.digest("hex");
      resolve(sha256);
      return;
    });
  });
}
