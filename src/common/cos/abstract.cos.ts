import { existsSync, mkdirSync, promises, statSync, unlinkSync } from "fs";
import { join } from "path";
import { Logger } from "../../ui/logger";

export abstract class AbstractCos<C = any> {
  constructor(
    protected id: string,
    protected key: string,
    protected region: string,
    protected bucket: string,
  ) { }

  protected client: C;

  private isFile(filepath: string) {
    const _paths = filepath.split('/')
    return _paths[_paths.length - 1].includes('.')
  }

  private isDirectory(filepath: string) {
    return statSync(filepath).isDirectory();
  }

  private filepath(name: string) {
    return name.split('/').filter(Boolean).join('/');
  }
  private mkdir(name: string) {
    let dir = name;
    if (this.isFile(name)) {
      let filepath = name.split('/');
      dir = filepath.splice(0, filepath.length - 1).join('/');
      dir = dir.startsWith('/') ? dir : `/${dir}`;
    }
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  protected abstract getFiles(dir: string): Promise<string[]>

  private async walk(name: string, callback: (name: string) => void) {
    if (this.isFile(name)) {
      return await callback(name);
    }
    const dir = await promises.opendir(name);
    for await (const item of dir) {
      await this.walk(join(name, item.name), callback);
    }
  }
  private async walkRemote(name: string, callback: (name: string) => void) {
    if (this.isFile(name)) {
      return await callback(name);
    }
    const files = await this.getFiles(name);
    return await Promise.all(files.map(c => this.walkRemote(c, callback)));
  }

  private async collectLocalFiles(name: string) {
    const files = new Set<string>();
    await this.walk(name, path => {
      if (this.isFile(name)) {
        const paths = path.split('/');
        files.add(paths[paths.length - 1]);
      } else {
        files.add(path.replace(name, ''));
      }
    });
    return files;
  }

  private async collectRemoteFiles(name: string) {
    const files = new Set<string>();
    await this.walkRemote(name, path => {
      const _name = name.split('/').filter(Boolean).join('/')
      files.add(path.replace(_name, ''));
    });
    return files;
  }

  private findDeletedFiles(local: Set<string>, remote: Set<string>) {
    const deletedFiles = new Set<string>()
    for (const file of remote) {
      if (local.has(file)) {
        deletedFiles.add(file)
      }
    }
    return deletedFiles
  }

  protected abstract deleteRemoteFile(name: string): Promise<boolean>;

  protected abstract uploadRemoteFile(local: string, remote: string): Promise<boolean>;

  protected abstract dowloadRemoteFile(local: string, remote: string): Promise<boolean>;

  protected deleteLocalFile(name: string) {
    return unlinkSync(name);
  }

  private async cleanRemoteFiles(remote: string, files: Set<string>) {
    const size = files.size;
    let index = 0;
    let percent = 0;
    for (const file of files) {
      let name = join(remote, file);
      const status = await this.deleteRemoteFile(name);
      index++;
      percent = parseInt(((index / size) * 100) as any);
      if (status) {
        Logger.info(`[${index}/${size}, ${percent}%] cleaned remote: ${name}`)
      } else {
        Logger.wran(`[${index}/${size}, ${percent}%] cleaned remote: ${name}`)
      }
    }
  }

  private async cleanLocalFiles(local: string, files: Set<string>) {
    const size = files.size
    let index = 0
    let percent = 0
    for (const file of files) {
      const name = join(local, file);
      this.deleteLocalFile(name);
      index++;
      percent = parseInt(((index / size) * 100) as any);
      Logger.info(`[${index}/${size}, ${percent}%] cleaned local: ${name}`)
    }
  }

  private async uploadFiles(local: string, remote: string, files: Set<string>) {
    const size = files.size
    let index = 0
    let percent = 0
    let paths: string[] = [];
    for (const file of files) {
      const localFile = join(local, file);
      const remoteFile = join(remote, file);
      Logger.info(`[准备上传] ${localFile}`);
      const status = await this.uploadRemoteFile(localFile, remoteFile);
      index++
      percent = parseInt(((index / size) * 100) as any)
      if (status) {
        Logger.info(`[${index}/${size}, ${percent}%] upload remote: ${remoteFile}`)
      } else {
        Logger.wran(`[${index}/${size}, ${percent}%] upload remote: ${remoteFile}`)
        paths.push(file);
      }
    }
    return paths;
  }

  private async dowloadFiles(local: string, remote: string, files: Set<string>) {
    const size = files.size
    let index = 0
    let percent = 0
    let paths: string[] = [];
    for (const file of files) {
      const localFile = join(local, file);
      const remoteFile = join(remote, file);
      const status = await this.dowloadRemoteFile(localFile, remoteFile);
      index++
      percent = parseInt(((index / size) * 100) as any)
      if (status) {
        Logger.info(`[${index}/${size}, ${percent}%] dowload remote: ${remoteFile}`)
      } else {
        Logger.wran(`[${index}/${size}, ${percent}%] dowload remote: ${remoteFile}`)
        paths.push(file);
      }
    }
    return paths;
  }

  private path(local: string) {
    const _paths = local.split('/').filter(Boolean);
    if (this.isFile(local)) {
      return local.replace(_paths[_paths.length - 1], '');
    }
    return local;
  }

  public async upload(local: string, remote: string) {
    Logger.info(`[COS] 开始上传${local} -> ${remote}`)
    const localPath = this.path(local);
    const remotePath = this.path(remote);
    const localFiles = await this.collectLocalFiles(local);
    const remoteFiles = await this.collectRemoteFiles(remote);
    const deleteFiles = this.findDeletedFiles(localFiles, remoteFiles);
    if (deleteFiles.size > 0) {
      await this.cleanRemoteFiles(remotePath, deleteFiles);
    }
    const files = await this.uploadFiles(localPath, remotePath, localFiles);
    if (files.length) Logger.wran(`以下文件上传失败:\n${files.join('\n')}`);
    return !files.length;
  }

  public async uploads(assets: { local: string, remote: string }[]) {
    return Promise.all(assets.map(a => this.upload(a.local, a.remote))).then((val) => val.every(i => !!i));
  }

  public async dowload(local: string, remote: string) {
    Logger.info(`[COS] 开始下载${remote} -> ${local}`)
    const remoteFiles = await this.collectRemoteFiles(remote);
    this.mkdir(local);
    const localFiles = await this.collectLocalFiles(local);
    const deleteFiles = this.findDeletedFiles(remoteFiles, localFiles);
    if (deleteFiles.size > 0) {
      this.cleanLocalFiles(local, deleteFiles);
    }
    const files = await this.dowloadFiles(local, remote, remoteFiles);
    if (files.length) Logger.wran(`以下文件下载失败:\n${files.join('\n')}`);
    return !files.length;
  }

  public async dowloads(assets: { local: string, remote: string }[]) {
    return Promise.all(assets.map(a => this.dowload(a.local, a.remote))).then((val) => val.every(i => !!i));
  }
}