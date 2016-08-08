'use strict';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import {StatusBarManager} from './status-bar-manager';
import * as settings from './settings';
import * as helpers from './helpers';
import * as fs from 'fs';
var rimraf = require('rimraf');

export const EXTENSIONS = 'extensions.json'
export const SETTINGS = 'settings.json';
export const KEYBINDINGS = 'keybindings.json';
export const SNIPPETS = 'snippets';

export const currentVersion: string = '2.0.0';
export let vsCodeExtensionDir: string = helpers.getExtensionDir();
export let codeSyncExtensionDir: string = path.join(vsCodeExtensionDir, 'golf1052.code-sync-' + currentVersion);

export class CodeSync {
    private vsCodeExtensionDir: string;
    private codeSyncExtensionDir: string;
    private codeSyncDir: string;
    private statusBar: StatusBarManager;
    private codeSyncSettings: settings.CodeSyncSettings;
    private active: boolean;

    constructor(vsCodeExtensionDir: string, codeSyncExtensionDir: string, codeSyncDir: string) {
        this.vsCodeExtensionDir = vsCodeExtensionDir;
        this.codeSyncExtensionDir = codeSyncExtensionDir;
        this.codeSyncDir = codeSyncDir;
        this.statusBar = new StatusBarManager();
        this.codeSyncSettings = new settings.CodeSyncSettings(path.join(this.codeSyncExtensionDir, SETTINGS), path.join(this.codeSyncDir, EXTENSIONS));
        this.active = false;
    }

    get Active(): boolean {
        return this.active;
    }

    set Active(active: boolean) {
        if (active) {
            this.statusBar.show();
        }
        else {
            this.statusBar.hide();
        }
        this.active = active;
    }

    get Settings(): settings.CodeSyncSettings {
        return this.codeSyncSettings;
    }

    async checkForSettings() {
        this.statusBar.StatusBarText = 'Checking settings';
        this.checkForOldSettings();
        this.migrateSettings();
        let extensionDir = helpers.getDir(this.codeSyncExtensionDir);
        // if settings don't already exist
        if (!fs.existsSync(path.join(extensionDir, SETTINGS))) {
            let extPath: string = '';
            if (this.codeSyncDir == '') {
                extPath = await vscode.window.showInputBox({
                    prompt: 'Enter the full path to where you want CodeSync to sync to',
                    value: path.join(os.homedir(), 'OneDrive/Apps/code-sync')
                });
            }
            else {
                extPath = this.codeSyncDir;
            }

            let tmpSettings: settings.Settings = {
                $schema: './schema/settings.schema.json',
                externalPath: extPath,
                autoImport: true,
                autoExport: true,
                importSettings: true,
                importKeybindings: true,
                importSnippets: true,
                importExtensions: true,
                excluded: {
                    installed: [],
                    external: []
                }
            };
            this.Settings.Settings = tmpSettings;
            this.Settings.save();
        }
        let csSettings: settings.Settings = this.Settings.Settings;
        this.codeSyncDir = csSettings.externalPath;
        this.Settings.ExternalExtensionsPath = path.join(this.codeSyncDir, EXTENSIONS);
        if (!fs.existsSync(this.codeSyncDir)) {
            helpers.getDir(this.codeSyncDir);
        }
        this.statusBar.reset();
    }

    importAll() {
        this.startSync('Importing all');
        this.importSettings();
        this.importKeybindings();
        this.importSnippets();
        this.importExtensions();
        this.statusBar.reset();
    }

    exportAll() {
        this.startSync('Exporting all');
        this.exportSettings();
        this.exportKeybindings();
        this.exportSnippets();
        this.exportExtensions();
        this.statusBar.reset();
    }

    importSettings() {
        this.startSync('Importing settings');
        if (!fs.existsSync(path.join(this.codeSyncDir, SETTINGS))) {
            return;
        }
        helpers.copy(path.join(this.codeSyncDir, SETTINGS), helpers.getUserSettingsFilePath());
        this.statusBar.reset();
    }

    exportSettings() {
        this.startSync('Exporting settings');
        if (!fs.existsSync(helpers.getUserSettingsFilePath())) {
            return;
        }
        helpers.copy(helpers.getUserSettingsFilePath(), path.join(this.codeSyncDir, SETTINGS));
        this.statusBar.reset();
    }

    importKeybindings() {
        this.startSync('Importing keybindings');
        if (!fs.existsSync(path.join(this.codeSyncDir, KEYBINDINGS))) {
            return;
        }
        helpers.copy(path.join(this.codeSyncDir, KEYBINDINGS), helpers.getKeybindingsFilePath());
        this.statusBar.reset();
    }

    exportKeybindings() {
        this.startSync('Exporting keybindings');
        if (!fs.existsSync(helpers.getKeybindingsFilePath())) {
            return;
        }
        helpers.copy(helpers.getKeybindingsFilePath(), path.join(this.codeSyncDir, KEYBINDINGS));
        this.statusBar.reset();
    }

    importSnippets() {
        this.startSync('Importing snippets');
        if (!fs.existsSync(path.join(this.codeSyncDir, SNIPPETS))) {
            return;
        }
        helpers.copy(path.join(this.codeSyncDir, SNIPPETS), helpers.getSnippetsFolderPath());
        this.statusBar.reset();
    }

    exportSnippets() {
        this.startSync('Exporting snippets');
        if (!fs.existsSync(helpers.getSnippetsFolderPath())) {
            return;
        }
        helpers.copy(helpers.getSnippetsFolderPath(), path.join(this.codeSyncDir, SNIPPETS));
        this.statusBar.reset();
    }

    importExtensions() {
        this.startSync('Importing extensions');
        let excluded: string[] = this.Settings.ExcludedExternalPackages;
        let extensions: string[] = this.Settings.Extensions;
        let installedAny: boolean = false;
        extensions.forEach(e => {
            let val = helpers.installExtension(e);
            if (val) {
                installedAny = true;
            }
        });
        if (installedAny) {
            this.statusBar.StatusBarText = 'Restart required';
            this.statusBar.setStop();
        }
        else {
            this.statusBar.reset();
        }
    }

    exportExtensions() {
        this.startSync('Exporting extensions');
        let excluded: string[] = this.Settings.ExcludedInstalledPackages;
        let extensions: string[] = [];
        let e = helpers.getInstalledExtensions();
        helpers.getInstalledExtensions().forEach(e => {
            if (excluded.indexOf(e.id) == -1) {
                extensions.push(e.id);
            }
        });
        this.Settings.Extensions = extensions;
        this.Settings.saveExtensions();
        this.statusBar.reset();
    }

    async addExcludedInstalledPackage() {
        let excluded: string[] = this.Settings.Settings.excluded.installed;
        let items: vscode.QuickPickItem[] = [];
        let installed = helpers.getInstalledExtensions();
        if (installed.length == 0) {
            vscode.window.showInformationMessage('There are no installed extensions.');
            return;
        }
        installed.forEach(e => {
            if (excluded.indexOf(e.id) == -1) {
                items.push({
                    label: e.id,
                    description: e.packageJSON.description
                });
            }
        });
        if (items.length == 0) {
            vscode.window.showInformationMessage('All installed extensions excluded.');
            return;
        }
        let result = await vscode.window.showQuickPick(items, {matchOnDescription: true});
        if (result) {
            excluded.push(result.label);
            let settings = this.Settings.Settings;
            settings.excluded.installed = excluded;
            this.Settings.Settings = settings;
            this.Settings.save();
            vscode.window.showInformationMessage('Successfully excluded package ' + result.label);
        }
    }

    async removeExcludedInstalledPackage() {
        let excluded: string[] = this.Settings.Settings.excluded.installed;
        let items: vscode.QuickPickItem[] = [];
        excluded.forEach(str => {
            items.push({
                label: str,
                description: ''
            });
        });
        if (items.length == 0) {
            vscode.window.showInformationMessage('No installed extensions excluded.');
            return;
        }
        let result = await vscode.window.showQuickPick(items);
        if (result) {
            excluded.splice(excluded.indexOf(result.label, 1));
            let settings = this.Settings.Settings;
            settings.excluded.installed = excluded;
            this.Settings.Settings = settings;
            this.Settings.save();
            vscode.window.showInformationMessage('Successfully included package ' + result.label);
        }
    }

    async addExcludedExternalPackage() {
        let excluded: string[] = this.Settings.Settings.excluded.external;
        let external: string[] = this.Settings.Extensions;
        let items: vscode.QuickPickItem[] = [];
        if (external.length == 0) {
            vscode.window.showInformationMessage('There are no external extensions.');
            return;
        }
        external.forEach(e => {
            if (excluded.indexOf(e) == -1) {
                items.push({
                    label: e,
                    description: ''
                });
            }
        });
        if (items.length == 0) {
            vscode.window.showInformationMessage('All external extensions excluded.');
            return;
        }
        let result = await vscode.window.showQuickPick(items);
        if (result) {
            excluded.push(result.label);
            let settings = this.Settings.Settings;
            settings.excluded.external = excluded;
            this.Settings.Settings = settings;
            this.Settings.save();
            vscode.window.showInformationMessage('Successfully excluded package ' + result.label);
        }
    }

    async removeExcludedExternalPackage() {
        let excluded: string[] = this.Settings.Settings.excluded.external;
        let items: vscode.QuickPickItem[] = [];
        excluded.forEach(str => {
            items.push({
                label: str,
                description: ''
            });
        });
        if (items.length == 0) {
            vscode.window.showInformationMessage('No external extensions excluded.');
            return;
        }
        let result = await vscode.window.showQuickPick(items);
        if (result) {
            excluded.splice(excluded.indexOf(result.label, 1));
            let settings = this.Settings.Settings;
            settings.excluded.external = excluded;
            this.Settings.Settings = settings;
            this.Settings.save();
            vscode.window.showInformationMessage('Successfully included package ' + result.label);
        }
    }

    displayExcludedInstalledPackages() {
        let excluded: string[] = this.Settings.Settings.excluded.installed;
        if (excluded.length == 0) {
            vscode.window.showInformationMessage('No excluded installed packages.');
            return;
        }
        vscode.window.showInformationMessage('Excluded installed packages:');
        excluded.forEach(e => {
            vscode.window.showInformationMessage(e);
        });
    }

    displayExcludedExternalPackages() {
        let excluded: string[] = this.Settings.Settings.excluded.external;
        if (excluded.length == 0) {
            vscode.window.showInformationMessage('No excluded external packages.');
            return;
        }
        vscode.window.showInformationMessage('Excluded external packages:');
        excluded.forEach(e => {
            vscode.window.showInformationMessage(e);
        });
    }

    async toggleSetting(setting: string, value: boolean) {
        let items: vscode.QuickPickItem[] = [];
        items.push({label: 'On', description: ''});
        items.push({label: 'Off', description: ''});
        let options: vscode.QuickPickOptions = {};
        if (value) {
            items[0].description = 'Current setting';
        }
        else {
            items[1].description = 'Current setting';
        }
        let settings = this.Settings.Settings;
        let result = await vscode.window.showQuickPick(items, options);
        if (result) {
            if (result.label == 'On') {
                settings[setting] = true;
            }
            else {
                settings[setting] = false;
                if (setting == 'importSettings') {
                    if (fs.existsSync(path.join(this.Settings.Settings.externalPath, SETTINGS))) {
                        rimraf.sync(path.join(this.Settings.Settings.externalPath, SETTINGS));
                    }
                }
                else if (setting == 'importKeybindings') {
                    if (fs.existsSync(path.join(this.Settings.Settings.externalPath, KEYBINDINGS))) {
                        rimraf.sync(path.join(this.Settings.Settings.externalPath, KEYBINDINGS));
                    }
                }
                else if (setting == 'importSnippets') {
                    if (fs.existsSync(path.join(this.Settings.Settings.externalPath, SNIPPETS))) {
                        rimraf.sync(path.join(this.Settings.Settings.externalPath, SNIPPETS));
                    }
                }
                else if (setting == 'importExtensions') {
                    if (fs.existsSync(path.join(this.Settings.Settings.externalPath, EXTENSIONS))) {
                        rimraf.sync(path.join(this.Settings.Settings.externalPath, EXTENSIONS));
                    }
                }
            }
            this.Settings.Settings = settings;
            this.Settings.save();
        }
    }

    private startSync(text: string) {
        this.statusBar.StatusBarText = text;
        this.statusBar.setSync();
    }

    private checkForOldSettings() {
        let folders: string[] = fs.readdirSync(this.vsCodeExtensionDir);
        folders.forEach(f => {
            let tmpExtension = helpers.getFolderExtensionInfo(f);
            if (tmpExtension.id == 'golf1052.code-sync') {
                if (tmpExtension.version != '') {
                    let splitVersion = tmpExtension.version.split('.');
                    if (splitVersion.length > 0) {
                        let major = parseInt(splitVersion[0]);
                        if (!isNaN(major) && major < 2) {
                            this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                            rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                        }
                    }
                    else {
                        this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                        rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                    }
                }
                else {
                    this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                    rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                }
            }
        });
    }

    private migrateSettings() {
        let folders: string[] = fs.readdirSync(this.vsCodeExtensionDir);
        folders.forEach(f => {
            let tmpExtension = helpers.getFolderExtensionInfo(f);
            if (tmpExtension.id == 'golf1052.code-sync') {
                if (tmpExtension.id == 'golf1052.code-sync' && helpers.isVersionGreaterThan(currentVersion, tmpExtension.version) == 1) {
                    if (fs.existsSync(path.join(this.vsCodeExtensionDir, f, SETTINGS))) {
                        helpers.copy(path.join(this.vsCodeExtensionDir, f, SETTINGS), path.join(this.codeSyncExtensionDir, SETTINGS));
                    }
                }
            }
        })
    }

    private emptySyncDir(settingsFilePath: string) {
        let settings: any = null;
        if (fs.existsSync(settingsFilePath)) {
            settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
        }
        try {
            if (fs.existsSync(settings.externalPath)) {
                let stuff = fs.readdirSync(settings.externalPath);
                stuff.forEach(f => {
                    rimraf.sync(path.join(settings.externalPath, f));
                });
            }
        }
        catch (ex) {
            return;
        }
    }
}
