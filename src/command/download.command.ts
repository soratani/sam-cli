import { Command } from "commander";
import { get } from 'lodash';
import { AbstractCommand } from "./abstract.command";
import { Input } from "./command.input";
import path = require("path");


export class DownloadCommand extends AbstractCommand {
    public load(program: Command): void {
        program
            .command('download')
            .description('下载资源文件')
            .option('-c, --config [config]', '配置文件', 'assets.yaml')
            .option('-id, --accessKeyId [accessKeyId]', 'accessKeyId')
            .option('-key, --accessKeySecret [accessKeySecret]', 'accessKeySecret')
            .action(async (command: Command) => {
                const config = get(command, 'config');
                const accessKeyId = get(command, 'accessKeyId');
                const accessKeySecret = get(command, 'accessKeySecret');
                const cos = [accessKeyId, accessKeySecret].every(Boolean);
                const inputs: Input[] = [];
                const options: Input[] = [];
                options.push({
                    name: 'cos',
                    value: cos,
                });
                options.push({
                    name: 'config',
                    value: path.join(process.cwd(), config),
                });
                options.push({
                    name: 'accessKeyId',
                    value: accessKeyId
                })
                options.push({
                    name: 'accessKeySecret',
                    value: accessKeySecret
                })
                await this.action.handle(inputs, options);
            })
    }
}