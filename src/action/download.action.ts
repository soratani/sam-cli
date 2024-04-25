import { get } from 'lodash';
import { join } from "path";
import { Input } from "@/command";
import { AbstractAction } from "@/action";
import { Logger } from "@/ui/logger";
import { COS, CosType } from "@/common/cos";

export class DownloadAction extends AbstractAction {
    public async handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
        const cos = options.find((o) => o.name === 'cos')?.value;
        const config = options.find((o) => o.name === 'config')?.value as string;
        const accessKeyId = options.find((o) => o.name === 'accessKeyId')?.value as string;
        const accessKeySecret = options.find((o) => o.name === 'accessKeySecret')?.value as string;

        try {
            const configData = this.config(config);
            const cosData = get(configData, 'cos');
            const assets = get(configData, 'assets', []);
            const cosAssets = assets.filter(i => i.type.includes('cos')).map((i) => ({
                ...i,
                local: join(process.cwd(), i.local)
            }));
            if (!Object.keys(cosData).length) throw new Error('请输入下载的cos配置');
            if (!assets.length) throw new Error('请输入资源信息');
            if (cos) {
                const cos = COS.create(cosData.type == 'tencent' ? CosType.Tencent : CosType.Ali, {
                    id: accessKeyId,
                    key: accessKeySecret,
                    region: cosData.region,
                    bucket: cosData.bucket,
                });
                const cosStatus = await cos.dowloads(cosAssets);
                if ([cosStatus].includes(false)) throw new Error('文件下载失败');
                return;
            }
        } catch (error) {
            Logger.error(error.message);
        }
    }
}