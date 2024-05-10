import Config, { PackageInfo } from "@/common/config";
import Server from "webpack-dev-server";
import createConfig from "./config";
import { webpack } from "webpack";

export default function start(pkg: PackageInfo, config: Config) {
  const webpackConfig = createConfig(pkg, config);
  const com = webpack(webpackConfig);
  const instance = new Server(com, {
    static: {
      directory: webpackConfig.output.path,
    },
    historyApiFallback: true,
    compress: true,
    hot: true,
    open: true,
  });
  instance.listen(3000, "0.0.0.0", function (err) {
    console.log(err);
  });
}
