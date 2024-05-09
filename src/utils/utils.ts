// 生成文件hash
import { glob } from "glob";
import crypto from "crypto";
import path, { join } from "path";
import { existsSync, readFileSync, readdirSync, stat, statSync } from "fs";
import ora from "ora";

type SpinnerName =
  | "dots"
  | "dots2"
  | "dots3"
  | "dots4"
  | "dots5"
  | "dots6"
  | "dots7"
  | "dots8"
  | "dots9"
  | "dots10"
  | "dots11"
  | "dots12"
  | "dots8Bit"
  | "sand"
  | "line"
  | "line2"
  | "pipe"
  | "simpleDots"
  | "simpleDotsScrolling"
  | "star"
  | "star2"
  | "flip"
  | "hamburger"
  | "growVertical"
  | "growHorizontal"
  | "balloon"
  | "balloon2"
  | "noise"
  | "bounce"
  | "boxBounce"
  | "boxBounce2"
  | "binary"
  | "triangle"
  | "arc"
  | "circle"
  | "squareCorners"
  | "circleQuarters"
  | "circleHalves"
  | "squish"
  | "toggle"
  | "toggle2"
  | "toggle3"
  | "toggle4"
  | "toggle5"
  | "toggle6"
  | "toggle7"
  | "toggle8"
  | "toggle9"
  | "toggle10"
  | "toggle11"
  | "toggle12"
  | "toggle13"
  | "arrow"
  | "arrow2"
  | "arrow3"
  | "bouncingBar"
  | "bouncingBall"
  | "smiley"
  | "monkey"
  | "hearts"
  | "clock"
  | "earth"
  | "material"
  | "moon"
  | "runner"
  | "pong"
  | "shark"
  | "dqpb"
  | "weather"
  | "christmas"
  | "grenade"
  | "point"
  | "layer"
  | "betaWave"
  | "fingerDance"
  | "fistBump"
  | "soccerHeader"
  | "mindblown"
  | "speaker"
  | "orangePulse"
  | "bluePulse"
  | "orangeBluePulse"
  | "timeTravel"
  | "aesthetic"
  | "dwarfFortress";

function loopdir(dir: string): string[] {
  const dirs = readdirSync(dir);
  return dirs.reduce((pre, item) => {
    const _path = join(dir, item);
    const state = statSync(_path);
    if (state.isDirectory()) return pre.concat(loopdir(_path));
    return pre.concat([ _path ]);
  }, []);
}

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

export function createTask(
  type: SpinnerName,
  prefixText: string,
  title: string
) {
  return ora({
    prefixText,
    spinner: type,
    text: title,
    color: "blue",
    interval: 80,
  });
}

export function findFiles(dir: string) {
  if (!dir) return [];
  const stat = statSync(dir);
  if (!existsSync(dir)) return [];
  if (stat.isFile()) return [dir];
  return loopdir(dir).map((item) => item.replace(dir, ''))
}