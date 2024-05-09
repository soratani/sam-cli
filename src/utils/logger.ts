import colors from 'chalk';

export const ERROR_PREFIX = colors.bgRgb(210, 0, 75).bold.rgb(0, 0, 0)(
  " ERROR "
);
export const INFO_PREFIX = colors.bgRgb(35, 187, 40).bold.rgb(0, 0, 0)(
  " INFO "
);
export const WRAN_PREFIX = colors.bgRgb(208, 211, 45).bold.rgb(0, 0, 0)(
  " WRAN "
);

export class Logger {
  static error(message: string, ...args: any[]) {
    console.log(`${ERROR_PREFIX} ${colors.redBright(message)}`, ...args);
    process.exit(1);
  }
  static info(message: string, ...args: any[]) {
    console.log(`${INFO_PREFIX} ${colors.green(message)}`, ...args);
  }
  static wran(message: string, ...args: any[]) {
    console.log(`${WRAN_PREFIX} ${colors.yellow(message)}`, ...args);
  }
  static baseText(message: string) {
    return colors.blue(message);
  }
  static errorText(message: string) {
    return colors.redBright(message);
  }
  static infoText(message: string) {
    return colors.green(message);
  }
  static wranText(message: string) {
    return colors.yellow(message);
  }
}