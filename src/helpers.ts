'use strict';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as cs from './cs';
var recursive_copy = require('recursive-copy');
var mkdirp = require('mkdirp');
import * as json from 'comment-json';
import {Logger} from './logger';

let logger: Logger = new Logger('helpers');

export interface FolderExtension {
    id: string;
    version: string;
}

let windows: boolean = process.platform == 'win32';
let osx: boolean = process.platform == 'darwin';
let linux: boolean = process.platform == 'linux';

export function getInstalledExtensions(): vscode.Extension<any>[] {
    return vscode.extensions.all.filter(e => {
        return e.extensionPath.startsWith(os.homedir());
    });
}

export function getExtensionDir(): string {
    let extensions = getInstalledExtensions();
    if (extensions.length > 0) {
        let p: path.ParsedPath = path.parse(extensions[0].extensionPath);
        return p.dir;
    }
    else {
        return path.join(os.homedir(), '.vscode/extensions');
    }
}

function getCodeSettingsFolderPath(): string {
    if (windows) {
        return path.join(process.env.APPDATA, 'Code/User/');
    }
    else if (osx) {
        return path.join(os.homedir(), 'Library/Application Support/Code/User/');
    }
    else if (linux) {
        return path.join(os.homedir(), '.config/Code/User/');
    }
    else {
        return '';
    }
}

export function getUserSettingsFilePath(): string {
    return path.join(getCodeSettingsFolderPath(), cs.SETTINGS);
}

export function getKeybindingsFilePath(): string {
    return path.join(getCodeSettingsFolderPath(), cs.KEYBINDINGS);
}

export function getSnippetsFolderPath(): string {
    return path.join(getCodeSettingsFolderPath(), cs.SNIPPETS + '/');
}

export async function copy(src: string, dest: string) {
    var options: any = {
        overwrite: true
    };
    await recursive_copy(src, dest, options);
}

export function getDir(path: string): string {
    mkdirp.sync(path);
    return path;
}

// returns false if the extension was already installed
// returns true otherwise...
export function installExtension(name: string): boolean {
    logger.appendLine(`Installing extension: ${name}...`);
    let options: child_process.ExecSyncOptions = {};
    options.encoding = 'utf8';
    let command: string = getCodeCommand() + ' --install-extension ';
    command += name;
    let out: Buffer = new Buffer('');
    try {
        out = child_process.execSync(command, options);
    }
    catch (e) {
        const err: Error = e;
        logger.appendLine('Error while executing installExtension()');
        logger.appendLine(`Command: ${command}`);
        logError(err);
        logger.appendLine('Failing extension installation.');
    }

    if (out.indexOf('is already installed') != -1) {
        logger.appendLine('Extension was already installed.');
        return false;
    }
    else {
        logger.appendLine('Extension installation succeeded.');
        return true;
    }
}

export function isCodeOnPath(): boolean {
    let version: string = '';
    let command = getCodeCommand() + ' --version';
    try {
        version = child_process.execSync(command, {encoding: 'utf8'});
    }
    catch (e) {
        const err: Error = e;
        logger.appendLine(`Error while executing isCodeOnPath()`);
        logger.appendLine(`Command: ${command}`);
        logError(err);
        logger.appendLine(`Defaulting to false`);
        return false;
    }
    logger.appendLine(`Found code version: ${version}.`);
    if (version != '') {
        return true;
    }
    return false;
}

export function logError(err: Error): void {
    logger.appendLine(`Exception:`);
    logger.appendLine(`\tName: ${err.name}`);
    logger.appendLine(`\tMessage: ${err.message}`);
    logger.appendLine(`\tStacktrace: ${err.stack}`);
}

function getCodeCommand(): string {
    if (windows) {
        return 'code.cmd';
    }
    else {
        return 'code';
    }
}

/**
 * Given publisher.name-version returns a FolderExtension object with id = publisher.name and
 * version = version. If the folderName is malformed then id = folderName and version will be
 * an empty string
 */
export function getFolderExtensionInfo(folderName: string): FolderExtension {
    let id: string = '';
    let version: string = '';
    if (folderName.lastIndexOf('-') != -1) {
        let tmpVersion: string = folderName.substring(folderName.lastIndexOf('-') + 1);
        if (!isNaN(parseInt(tmpVersion[0])) &&
        !isNaN(parseInt(tmpVersion[tmpVersion.length - 1]))) {
            id = folderName.substring(0, folderName.lastIndexOf('-'));
            version = tmpVersion;
        }
        else {
            id = folderName;
        }
    }
    else {
        id = folderName;
    }
    return {
        id: id,
        version: version
    };
}

/**
 * Checks if a > b.
 * If a > b return 1
 * If a === b return 0
 * If a < b return -1
 */
export function isVersionGreaterThan(a: string, b: string): number {
    if (a === b) {
        return 0;
    }
    else if ((typeof a !== 'undefined' && typeof b === 'undefined') ||
        (a !== null && b === null)) {
        return 1;
    }
    else if ((typeof a === 'undefined' && typeof b !== 'undefined') ||
        (a === null && b !== null)) {
        return -1;
    }
    else {
        let aSplit: string[] = a.split('.');
        let bSplit: string[] = b.split('.');
        if (aSplit.length >= bSplit.length) {
            for (let i: number = 0; i < aSplit.length; i++) {
                let aNum: number = parseInt(aSplit[i]);
                if (bSplit[i]) {
                    let bNum: number = parseInt(bSplit[i]);
                    if (aNum > bNum) {
                        return 1;
                    }
                    else if (aNum < bNum) {
                        return -1;
                    }
                }
                else {
                    if (aNum > 0) {
                        return 1;
                    }
                }
            }
        }
        else {
            for (let i: number = 0; i < bSplit.length; i++) {
                let bNum: number = parseInt(bSplit[i]);
                if (aSplit[i]) {
                    let aNum: number = parseInt(aSplit[i]);
                    if (bNum > aNum) {
                        return -1;
                    }
                    else if (bNum < aNum) {
                        return 1;
                    }
                }
                else {
                    if (bNum > 0) {
                        return -1;
                    }
                }
            }
        }
        return 0;
    }
}

export function isFileEmpty(path: string): boolean {
    let stats: fs.Stats = fs.statSync(path);
    return stats.size == 0;
}

export function isFileContentEmpty(path: string): boolean {
    let fileContent: string = fs.readFileSync(path, 'utf8');
    fileContent = fileContent.trim();
    return fileContent == '';
}

export function getCodePathWarningMessage(): string {
    return 'Code was not found on your path, CodeSync will be unable to import or export your extensions.';
}

export function parseJson(str: string): any {
    return json.parse(str);
}

export function stringifyJson(obj: any): string {
    return json.stringify(obj, null, 4);
}
