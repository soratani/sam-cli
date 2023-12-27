import * as Client from 'ssh2-sftp-client'
import * as glob from 'glob'
import { join } from 'path'
import { statSync } from 'fs'
import { Logger } from '../../ui/logger'

async function upload(client: Client, file: string, local: string, remote: string) {
  try {
    await client.fastPut(file, file.replace(local, remote));
    return file;
  } catch (error) {
    return null;
  }
}

export async function uploadFile(
  client: Client,
  local: string,
  remote: string,
  ignore: string[] = []
): Promise<boolean> {
  const paths = glob.sync(join(local, '**/*'), { ignore: ignore || [] })
  const files = paths.filter(f => statSync(f).isFile())
  const dirs = paths.filter(f => statSync(f).isDirectory())
  const status = await Promise.all(
    dirs.map(async d => {
      try {
        const str = await client.mkdir(d.replace(local, remote), true);
        Logger.info(`成功在服务器创建文件夹:${d.replace(local, remote)}`)
        return true;
      } catch (error) {
        Logger.wran(`在服务器创建文件夹失败:${d.replace(local, remote)}`)
        return false;
      }
    })
  ).then((v) => v.every(i => !!i));
  if (!status) {
    Logger.wran(`以下文件上传失败:\n${files.join('\n')}`)
    return false;
  };
  let index = 0
  let percent = 0
  let _paths: string[] = [];
  let size = files.length;
  for (const file of files) {
    const status = await upload(client, file, local, remote);
    index++
    percent = parseInt(((index / size) * 100) as any)
    if (status) {
      Logger.info(`[${index}/${size}, ${percent}%] upload remote: ${file}`)
    } else {
      Logger.wran(`[${index}/${size}, ${percent}%] upload remote: ${file}`)
      _paths.push(file);
    }
  }
  if (_paths.length) Logger.wran(`以下文件上传失败:\n${_paths.join('\n')}`)
  return !_paths.length;
}