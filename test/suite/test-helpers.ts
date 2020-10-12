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
