import { Command } from "commander";
import { get } from 'lodash';
import { AbstractCommand } from "./abstract.command";
import { Input } from ".";


export class CompressCommand extends AbstractCommand {
    public load(program: Command): void {
        program
            .command('compress')
            .description('压缩文件')
            .option('-c, --config [config]', '配置文件', 'assets.yaml')
            .option('-t, --type [type]', '压缩类型: package、app', 'package')
            .action(async (command: Command) => {
                const type = get(command, 'type');
                const config = get(command, 'config');
                const inputs: Input[] = [];
                const options: Input[] = [];
                options.push({
                    name: 'type',
                    value: type,
                });
                options.push({
                    name: 'config',
                    value: config,
                });
                await this.action.handle(inputs, options);
            });
    }
}