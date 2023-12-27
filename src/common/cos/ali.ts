import { AbstractCos } from "./abstract.cos";
import * as COS from 'ali-oss';


export class AliCos extends AbstractCos {
  constructor(
    protected id: string,
    protected key: string,
    protected region: string,
    protected bucket: string,
  ) {
    super(id, key, region, bucket);
    this.client = new COS({
      region: this.region,
      accessKeyId: this.id,
      accessKeySecret: this.key,
      bucket: this.bucket
    });
  }


  protected async getFiles(dir: string): Promise<string[]> {
    return await this.client.list({
      prefix: dir
    })
  }
  protected async deleteRemoteFile(name: string): Promise<boolean> {
    try {
      await this.client.delete(name);
      return true;
    } catch (error) {
      return false;
    }
  }
  protected async uploadRemoteFile(local: string, remote: string): Promise<boolean> {
    try {
      await this.client.put(remote, local);
      return true;
    } catch (error) {
      return false;
    }
  }
  protected async dowloadRemoteFile(local: string, remote: string): Promise<boolean> {
    try {
      await this.client.get(remote, local);
      return true;
    } catch (error) {
      return false;
    }
  }

}