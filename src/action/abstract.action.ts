import { existsSync, readFileSync } from "fs";
import * as yaml from 'yaml';
import { Input } from "../command";
import { Logger } from "../ui/logger";
import { check, isYaml } from "../utils/check-config";

export abstract class AbstractAction {

  protected config(file: string) {
    if (!existsSync(file)) Logger.error('配置文件不存在');
    if (!isYaml(file)) Logger.error('非yaml配置文件');
    const data = readFileSync(file).toString();
    const yamlData = yaml.parse(data);
    return check(yamlData);
  }

  public abstract handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[],
  ): Promise<void>;
}