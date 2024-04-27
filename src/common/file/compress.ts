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
import { Logger } from "../../utils/logger";

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

function packageName(input: string) {
  const stat = statSync(input);
  const list = paths(input);
  if (stat.isDirectory()) {
    return list[list.length - 1];
  }
  return list[list.length - 2];
}

export interface IPackage {
  name: string;
  version: string;
  file: string;
}

export interface IZipOption {
  name: string;
  json: string;
  hash: string;
  input: string;
  output: string;
}

export function zip(options: IZipOption) {
  const { name, json, hash, input, output } = options;
  const pkgjson = packageInfo(json);
  const version = get(pkgjson, "version");
  if (!version) return;
  const outputPath = join(output, `${hash}.zip`);
  const outputStream = createWriteStream(outputPath);
  return new Promise<IPackage>((resolve) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    outputStream.on("close", function () {
      Logger.info(
        `${name}_${version}_${hash}.zip ${archive.pointer()} total bytes`
      );
      resolve({
        name: name,
        version: version,
        file: outputPath,
      });
    });
    outputStream.on("end", function () {
      Logger.info(`${name}_${version}_${hash}.zip`);
    });
    archive.on("warning", function (err) {
      Logger.wran(`${name}_${version}_${hash}.zip压缩异常`);
      if (err.code === "ENOENT") {
        resolve(undefined);
      } else {
        resolve(undefined);
      }
    });

    archive.on("error", function (err) {
      Logger.wran(`${name}_${version}_${hash}.zip压缩异常`);
      resolve(undefined);
    });
    archive.pipe(outputStream);
    return archive.directory(input, false).finalize();
  });
}
