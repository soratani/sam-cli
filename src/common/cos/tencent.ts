import * as COS from 'cos-nodejs-sdk-v5';
import { AbstractCos } from './abstract.cos';
import { createReadStream, createWriteStream } from 'fs';


export class TencentCos extends AbstractCos<COS> {
  constructor(
    protected id: string,
    protected key: string,
    protected region: string,
    protected bucket: string,
  ) {
    super(id, key, region, bucket);
    this.client = new COS({
      SecretId: this.id,
      SecretKey: this.key,
    });
  }

  protected getFiles(dir: string): Promise<string[]> {
    const _dir = dir.startsWith('/') ? dir.split('/').filter(Boolean).join('/') : dir;
    return new Promise<string[]>((resolve) => {
      this.client.getBucket(
        {
          Bucket: this.bucket,
          Region: this.region,
          Prefix: _dir
        },
        function (err, data) {
          if (err) {
            return resolve([]);
          } else {
            return resolve(data.Contents.map(item => item.Key))
          }
        }
      )
    })
  }

  protected uploadRemoteFile(local: string, remote: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: remote,
          StorageClass: 'STANDARD',
          Body: createReadStream(local)
        },
        function (err: any, data) {
          if (err) {
            return resolve(false)
          } else {
            return resolve(true)
          }
        }
      )
    })
  }
  protected deleteRemoteFile(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: name
        },
        function (err: any, data: unknown) {
          if (err) {
            return resolve(false)
          } else {
            return resolve(true)
          }
        }
      )
    })
  }

  protected dowloadRemoteFile(local: string, remote: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.getObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: remote,
          Output: createWriteStream(local, {
            flags: 'w'
          })
        },
        function (err: any, data) {
          if (err) {
            return resolve(false)
          } else {
            return resolve(true)
          }
        }
      )
    })
  }
}

