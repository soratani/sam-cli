import { AbstractCos } from "./abstract.cos";
import { AliCos } from "./ali";
import { TencentCos } from "./tencent";

export enum CosType {
  Tencent,
  Ali
}

export class COS {
  static create(type: CosType, options: {
    id: string,
    key: string,
    region: string,
    bucket: string,
  }): AbstractCos {
    switch (type) {
      case CosType.Tencent:
        return new TencentCos(options.id, options.key, options.region, options.bucket);
        break;
      default:
        return new AliCos(options.id, options.key, options.region, options.bucket);
        break;
    }
  }
}