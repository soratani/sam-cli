import Config, { PackageInfo } from "@/common/config";
import Server from "webpack-dev-server";
import createConfig from "./config";
import { webpack } from "webpack";
import { usePort } from "@/utils";
import { WebpackLogger } from "./logger";

function getInfrastructureLogger(name: string) {
    return new WebpackLogger()
}

export default async function start(pkg: PackageInfo, config: Config) {
  const webpackConfig = createConfig(pkg, config);
  const com = webpack(webpackConfig);
  const port = await usePort(3000, '0.0.0.0');
  com.getInfrastructureLogger = getInfrastructureLogger.bind(com);
  const instance = new Server({
    static: {
      directory: webpackConfig.output.path,
    },
    historyApiFallback: true,
    compress: true,
    hot: true,
    open: true,
    host: '0.0.0.0',
    port
    
  },com);
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
