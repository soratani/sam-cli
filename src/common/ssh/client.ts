import * as Client from 'ssh2-sftp-client'
import { Logger } from '../../ui/logger'

export interface ClientOption extends Client.ConnectOptions { }

export async function setupClient(options: Client.ConnectOptions) {
  const client = new Client()
  return client
    .connect(options)
    .catch(() => null)
    .then(() => client)
    .catch(() => {
      Logger.wran(`${options.host}链接失败`)
      return null
    })
}