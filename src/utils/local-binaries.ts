import { existsSync } from 'fs';
import { join, posix } from 'path';
import { CommandLoader } from '../command';

const localBinPathSegments = [process.cwd(), 'node_modules', 'envs-cli'];

export function localBinExists() {
    return existsSync(join(...localBinPathSegments));
}

export function loadLocalBinCommandLoader(): typeof CommandLoader {
    const commandsFile = require(posix.join(...localBinPathSegments,'build', 'commands'));
    return commandsFile.CommandLoader;
}