import { PackageInfo, Common } from "@/utils/config";
import Server from "webpack-dev-server";
import createAlias from "./alias";
import createConfig from "./config";
import { webpack } from "webpack";

export default function start(pkg: PackageInfo, common: Common[]) {
  const alias = createAlias(pkg, common);
  const config = createConfig(pkg, alias);
  const com = webpack(config);
  const instance = new Server(com, {
    static: {
      directory: config.output.path,
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
