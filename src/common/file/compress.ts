import {
  readdirSync,
  readFileSync,
  createWriteStream,
  statSync,
  existsSync,
} from "fs";
import archiver from "archiver";
import { get } from "lodash";
import { join } from "path";
import { Logger } from "../../ui/logger";

function paths(_path: string, split = "/") {
  return _path.split(split).filter(Boolean);
}

function packageInfo(filepath: string) {
  const code = readFileSync(filepath).toString();
  try {
    return JSON.parse(code);
  } catch (error) {
    return {};
  }
}

export interface IPackage {
  name: string;
  version: string;
  file: string;
}

export function zip(input: string, output: string) {
  const stat = statSync(input);
  const outStat = statSync(output);
  const pkgJson = join(input, "package.json");
  if (!stat.isDirectory() || !outStat.isDirectory()) return;
  if (!existsSync(pkgJson)) return;
  const pkgjson = packageInfo(pkgJson);
  const version = get(pkgjson, "version");
  let main = get(pkgjson, "main");
  if (!version || !main) return;
  const targetPaths = paths(input);
  const targetName = targetPaths[targetPaths.length - 1];
  main = join(input, main);
  const statMain = statSync(main);
  if (!statMain.isDirectory()) {
    main = paths(main);
    main.splice(-1, 1);
    main = `/${main.join("/")}`;
  }
  const outputPath = join(output, `${targetName}@${version}.zip`);
  const outputStream = createWriteStream(outputPath);
  return new Promise<IPackage>((resolve) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    outputStream.on("close", function () {
      Logger.info(
        `${targetName}@${version}.zip ${archive.pointer()} total bytes`
      );
    });
    outputStream.on("end", function () {
      Logger.info(`${targetName}压缩完毕`);
      resolve({
        name: targetName,
        version: version,
        file: outputPath,
      });
    });
    archive.on("warning", function (err) {
      Logger.wran(`${targetName}压缩异常`);
      if (err.code === "ENOENT") {
        resolve(undefined);
      } else {
        resolve(undefined);
      }
    });

    archive.on("error", function (err) {
      Logger.wran(`${targetName}压缩异常`);
      resolve(undefined);
    });
    archive.pipe(outputStream);
    return archive.directory(main, false).finalize();
  });
}
