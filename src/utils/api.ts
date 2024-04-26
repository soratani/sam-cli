import axios from "axios";
import home from "home";
import fs from "fs";
import { get } from "lodash";
import os from "os";
import md5 from "md5";
const pkg = require("../../package.json");

export function fingerprint() {
  const machine = os.machine();
  const arch = os.arch();
  const release = os.release();
  return md5(JSON.stringify({ machine, arch, release }));
}

export function getCredential() {
  const credentialPath = home.resolve("~/.samrc");
  if (!fs.existsSync(credentialPath)) return process.env.CREDENTIAL;
  return (
    process.env.CREDENTIAL ||
    fs.readFileSync(credentialPath, { encoding: "utf-8" })
  );
}

export function setCredential(value: string) {
  const credentialPath = home.resolve("~/.samrc");
  if (!fs.existsSync(credentialPath)) {
    fs.mkdirSync(credentialPath);
  }
  return fs.writeFileSync(credentialPath, value, { encoding: "utf-8" });
}

export interface IRes {
  code: number;
  message: string;
  data?: any;
}

export const api = axios.create({
  baseURL: process.env.HOST || "https://www.soratani.cn/api",
  headers: {
    version: pkg.version,
    app: pkg.name,
    fingerprint: fingerprint(),
    platform: 4,
    system: 2,
    type: 3,
  },
});

api.interceptors.request.use((config): any => {
  return {
    ...config,
    headers: {
      ...config.headers,
      credential: getCredential(),
    },
  };
});
api.interceptors.response.use(
  (value) => {
    return get(value, "data", { code: 500, message: "服务异常" });
  },
  (error) => {
    return get(error, "response.data", { code: 500, message: "服务异常" });
  }
);
