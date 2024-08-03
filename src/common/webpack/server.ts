import Config, { ApplicationInfo } from "@/common/config";
import Server, { ProxyConfigArrayItem } from "webpack-dev-server";
import createConfig from "./config";
import { webpack } from "webpack";
import { usePort } from "@/utils";
import { WebpackLogger } from "./logger";

function getInfrastructureLogger(name: string) {
    return new WebpackLogger()
}

export default async function start(pkg: ApplicationInfo, config: Config, proxy: ProxyConfigArrayItem[]) {
  const webpackConfig = createConfig(pkg, config);
  const com = webpack(webpackConfig);
  const port = await usePort(3000, '0.0.0.0');
  com.getInfrastructureLogger = getInfrastructureLogger.bind(com);
  const instance = new Server({
    static: {
      directory: webpackConfig.output.path,
    },
    proxy: proxy,
    historyApiFallback: true,
    compress: true,
    hot: true,
    open: true,
    host: '0.0.0.0',
    port
  },com);
  // 监听Ctrl+C信号
  process.on('SIGINT', () => {
    instance.stop();
    process.exit(); // 可选：强制立即退出
  });
  return new Promise<{ host: string, port: number }>((resolve, reject) => {
    instance.startCallback((error) => {
      if(error) {
        reject(error);
      } else {
        resolve({ host: '0.0.0.0', port })
      }
    })
  })
}
