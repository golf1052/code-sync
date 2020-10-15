import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import * as settings from '../../src/settings';
import * as vscode from 'vscode';

export function getDefaultSettings(): settings.Settings {
    return {
        $schema: './schema/settings.schema.json',
        externalPath: '',
        autoImport: true,
        autoExport: true,
        importSettings: true,
        importKeybindings: true,
        importSnippets: true,
        importExtensions: true,
        showStatusBarIcon: true,
        excluded: {
            installed: [],
            external: []
        },
        executableName: '',
        settingsPath: ''
    };
}

export function isInsiders(): boolean {
    return vscode.env.appName.toLowerCase().includes("insider");
}

export interface TestingResources {
    directories: string[];
    files: string[];
}

export function createTestingResources(): TestingResources {
    const resources: TestingResources = {
        directories: [],
        files: []
    };

    resources.directories.push(path.join(os.homedir(), 'code_sync_test_dir'));

    for (const directory of resources.directories) {
        if (!fs.existsSync(directory)) {
            mkdirp.sync(directory);
        }
    }

    for (const file of resources.files) {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, Buffer.from(''));
        }
    }

    return resources;
}

export function destroyTestingResources(resources: TestingResources): void {
    for (const file of resources.files) {
        fs.unlinkSync(file);
    }

    for (let i = resources.directories.length - 1; i >= 0; i--) {
        fs.rmdirSync(resources.directories[i]);
    }
}
