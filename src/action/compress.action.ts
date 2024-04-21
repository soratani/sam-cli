import { get } from "lodash";
import { Input } from "../command";
import { AbstractAction } from "./abstract.action";
import { join } from "path";
import { Logger } from "../ui/logger";
import { zip } from "../common/file";
import { readdirSync, statSync } from "fs";


export class CompressAction extends AbstractAction {
    public async handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
        const config = options.find((o) => o.name === 'config')?.value as string;
        const type = options.find((o) => o.name === 'type')?.value as string;
        if (!['package', 'app'].includes(type)) return Logger.error('打包类型错误');
        try {
            const configData = this.config(config);
            const { input, output } = get(configData, 'package');
            const inputPath = join(process.cwd(), input);
            const outputPath = join(process.cwd(), output);
            if(type == 'app') {
                await zip(inputPath, outputPath);
            } else {
                const dirs = readdirSync(inputPath).map(item => join(inputPath, item)).filter(item => statSync(item).isDirectory());
                await Promise.all(dirs.map(item => zip(item, output)));
                return;
            }
        } catch (error) {
            Logger.error(error.message);
        }
    }
}