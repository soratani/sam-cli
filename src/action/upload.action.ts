import { existsSync, readFileSync } from "fs";
import { get } from 'lodash';
import { join } from "path";
import * as yaml from 'yaml';
import { Input } from "../command";
import { AbstractAction } from "./abstract.action";
import { check, isYaml } from "../utils/check-config";
import { Logger } from "../ui/logger";
import { COS, CosType } from "../common/cos";
import { sshUpload } from "../common/ssh";

export class UploadAction extends AbstractAction {


    public async handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
        const ssh = options.find((o) => o.name === 'ssh')?.value;
        const cos = options.find((o) => o.name === 'cos')?.value;
        const config = options.find((o) => o.name === 'config')?.value as string;
        const username = options.find((o) => o.name === 'username')?.value as string;
        const password = options.find((o) => o.name === 'password')?.value as string;
        const accessKeyId = options.find((o) => o.name === 'accessKeyId')?.value as string;
        const accessKeySecret = options.find((o) => o.name === 'accessKeySecret')?.value as string;
        Logger.info(JSON.stringify([accessKeyId, accessKeySecret, username, password]));
        try {
            if (existsSync(config)) {
                if (!isYaml(config)) throw new Error('非yaml配置文件');
                const data = readFileSync(config).toString();
                const isAll = [ssh, cos].every(s => !!s);
                const yamlData = yaml.parse(data);
                const value = check(yamlData);
                const sshData = get(value, 'ssh', []);
                const cosData = get(value, 'cos');
                const assets = get(value, 'assets', []);
                const cosAssets = assets.filter(i => i.type.includes('cos')).map((i) => ({
                    ...i,
                    local: join(process.cwd(), i.local)
                }));
                const sshAssets = assets.filter(i => i.type.includes('ssh')).map((i) => ({
                    ...i,
                    local: join(process.cwd(), i.local)
                }));
                if (!sshData.length && !Object.keys(cosData).length) throw new Error('请输入上传的ssh配置或cos配置');
                if (!assets.length) throw new Error('请输入资源信息');
                if (isAll && [username,password].every(i => !!i) && [accessKeyId, accessKeySecret].every(i => !!i)) {
                    const sshOptions = sshData.map(s => ({
                        ...s,
                        port: Number(s.port),
                        username,
                        password
                    }))
                    const cos = COS.create(cosData.type == 'tencent' ? CosType.Tencent : CosType.Ali, {
                        id: accessKeyId,
                        key: accessKeySecret,
                        region: cosData.region,
                        bucket: cosData.bucket,
                    });
                    const cosStatus = await cos.uploads(cosAssets);
                    const sshStatus = await sshUpload(sshAssets, sshOptions);
                    if ([cosStatus, sshStatus].includes(false)) throw new Error('文件更新失败');
                    return;
                }
                if (ssh && [username,password].every(i => !!i)) {
                    const sshOptions = sshData.map(s => ({
                        ...s,
                        port: Number(s.port),
                        username,
                        password
                    }))
                    const sshStatus = await sshUpload(sshAssets, sshOptions);
                    if ([sshStatus].includes(false)) throw new Error('文件更新失败');
                    return;
                }
                if (cos && [accessKeyId, accessKeySecret].every(i => !!i)) {
                    const cos = COS.create(cosData.type == 'tencent' ? CosType.Tencent : CosType.Ali, {
                        id: accessKeyId,
                        key: accessKeySecret,
                        region: cosData.region,
                        bucket: cosData.bucket,
                    });
                    const cosStatus = await cos.uploads(cosAssets);
                    if ([cosStatus].includes(false)) throw new Error('文件更新失败');
                    return;
                }
                return;
            }
            Logger.error('配置文件不存在');
        } catch (error) {
            Logger.error(error.message);
        }
    }
}