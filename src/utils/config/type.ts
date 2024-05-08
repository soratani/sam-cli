export enum PACKAGE_TYPE {
  APP = "app",
  TEMPLATE = "template",
  H5 = "h5",
  WEB = "web",
}

export interface Builder {
  type: PACKAGE_TYPE;
  main: string;
}

export interface IPackage {
  name: string;
  source: string;
  builder: Builder[];
}

export interface Common {
  name: string;
  source: string;
  main: string;
}

export interface IConfig {
  package: IPackage[];
  common: Common[];
}

export interface PackageInfo extends Omit<IPackage, "builder"> {
  zip: string;
  version: string;
  hash: string;
  main: string;
  output: string;
  type: PACKAGE_TYPE;
}
