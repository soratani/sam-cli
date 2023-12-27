import { existsSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { AbstractAction } from "../action";
import { Logger } from "../ui/logger";


const localBinPathSegments = [process.cwd(), 'node_modules', '.bin', 'envs-cli'];
export abstract class AbstractCommand {
    constructor(protected action: AbstractAction) { }

    protected check() {
        const cmdFilePath = join(...localBinPathSegments);
        if (!existsSync(cmdFilePath)) {
            Logger.error('当前工程下缺少cli依赖,请执行下面的命令:\nnpm install envs-cli -D');
        }
    }

  public abstract load(program: Command): void;
}