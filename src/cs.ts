'use strict';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import {StatusBarManager} from './status-bar-manager';
import * as settings from './settings';
import * as helpers from './helpers';
import * as fs from 'fs';
var rimraf = require('rimraf');
import * as chokidar from 'chokidar';
import {FileWatcher} from './file-watcher';
import {LocalSettings} from './local-settings';
import {Logger} from './logger';

export const EXTENSIONS = 'extensions.json';
export const SETTINGS = 'settings.json';
export const KEYBINDINGS = 'keybindings.json';
export const SNIPPETS = 'snippets';
export const LOCAL_SETTINGS = 'local-settings.json';

export const currentVersion: string = '2.5.0';
export let vsCodeExtensionDir: string = helpers.getExtensionDir();
export let codeSyncExtensionDir: string = path.join(vsCodeExtensionDir, 'golf1052.code-sync-' + currentVersion);

export class CodeSync {
    private vsCodeExtensionDir: string;
    private codeSyncExtensionDir: string;
    private codeSyncDir: string;
    private statusBar: StatusBarManager;
    private codeSyncSettings: settings.CodeSyncSettings;
    private active: boolean;
    private fileWatcher: FileWatcher;
    private localSettingsManager: LocalSettings;
    private canManageExtensions: boolean;
    private logger: Logger;

    constructor(vsCodeExtensionDir: string, codeSyncExtensionDir: string, codeSyncDir: string) {
        this.logger = new Logger('cs');
        this.vsCodeExtensionDir = vsCodeExtensionDir;
        this.codeSyncExtensionDir = codeSyncExtensionDir;
        this.codeSyncDir = codeSyncDir;
        this.statusBar = new StatusBarManager();
        this.codeSyncSettings = new settings.CodeSyncSettings(path.join(this.codeSyncExtensionDir, SETTINGS), path.join(this.codeSyncDir, EXTENSIONS));
        this.active = false;
        this.localSettingsManager = new LocalSettings(this.codeSyncExtensionDir);
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

    get CanManageExtensions(): boolean {
        return this.canManageExtensions;
    }

    set CanManageExtensions(canManageExtensions: boolean) {
        this.canManageExtensions = canManageExtensions;
    }

    toggleStatusBarIcon(): void {
        let settings = this.Settings.Settings;
        let visible = this.statusBar.toggle();
        settings.showStatusBarIcon = visible;
        this.Settings.Settings = settings;
        this.Settings.save();
    }

    setStatusBarIcon(): void {
        let settings = this.Settings.Settings;
        if (!settings.showStatusBarIcon) {
            this.statusBar.hide();
        }
    }

    async checkForSettings() {
        this.logger.appendLine('Checking settings');
        this.statusBar.StatusBarText = 'Checking settings';
        this.checkForOldSettings();
        await this.migrateSettings();
        let extensionDir = helpers.getDir(this.codeSyncExtensionDir);
        // if settings don't already exist
        if (!fs.existsSync(path.join(extensionDir, SETTINGS))) {
            this.logger.appendLine(`Could not find settings in ${path.join(extensionDir, SETTINGS)}. Creating...`);
            // we need to create settings on first launch because when we call this.Settings.Settings
            // we're going to try to read settings that don't exist yet
            let tmpSettings: settings.Settings = {
                $schema: './schema/settings.schema.json',
                externalPath: path.join(os.homedir(), 'OneDrive/Apps/code-sync'),
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
                }
            };
            this.Settings.Settings = tmpSettings;
            this.Settings.save();

            await this.setExternalSyncPath();
        }
        let csSettings: settings.Settings = this.Settings.Settings;
        this.codeSyncDir = csSettings.externalPath;
        let externalExtensionsPath = path.join(this.codeSyncDir, EXTENSIONS);
        this.logger.appendLine(`Setting external extensions path as ${externalExtensionsPath}.`);
        this.Settings.ExternalExtensionsPath = externalExtensionsPath;
        if (!fs.existsSync(this.codeSyncDir)) {
            this.logger.appendLine(`CodeSync external sync directory isn't there?`);
            this.logger.appendLine(`Creating external sync path directory: ${this.codeSyncDir}.`);
            helpers.getDir(this.codeSyncDir);
        }
        this.statusBar.reset();
        this.logger.appendLine('Done checking settings.');
        this.logger.appendLine(`External sync directory: ${csSettings.externalPath}`);
    }

    async setExternalSyncPath() {
        let extPath: string = '';
        extPath = await vscode.window.showInputBox({
            prompt: 'Enter the full path to where you want CodeSync to sync to',
            value: path.join(os.homedir(), 'OneDrive/Apps/code-sync')
        });
        if (extPath == undefined) {
            return;
        }
        else if (extPath == '') {
            await vscode.window.showWarningMessage('External sync path was blank');
            return;
        }
        if (!fs.existsSync(extPath)) {
            this.logger.appendLine(`Creating external sync path: ${extPath}`);
            helpers.getDir(extPath);
        }
        let csSettings: settings.Settings = this.Settings.Settings;
        csSettings.externalPath = extPath;
        this.codeSyncDir = extPath;
        this.Settings.Settings = csSettings;
        this.Settings.save();
        this.logger.appendLine(`External sync path is now ${this.Settings.Settings.externalPath}.`);
    }

    startFileWatcher = () => {
        let files: any = {};
        if (fs.existsSync(helpers.getUserSettingsFilePath())) {
            files[helpers.getUserSettingsFilePath()] = this.exportSettings.bind(this);
        }
        if (fs.existsSync(helpers.getKeybindingsFilePath())) {
            files[helpers.getKeybindingsFilePath()] = this.exportKeybindings.bind(this);
        }
        if (fs.existsSync(helpers.getSnippetsFolderPath())) {
            files[helpers.getSnippetsFolderPath()] = this.exportSnippets.bind(this);
        }
        this.fileWatcher = new FileWatcher(files, this.Settings);
    }

    async importAll() {
        this.startSync('Importing all');
        this.importSettings();
        await this.importKeybindings();
        await this.importSnippets();
        if (this.CanManageExtensions) {
            this.importExtensions();
        }
        this.statusBar.reset();
    }

    async exportAll() {
        this.startSync('Exporting all');
        this.exportSettings();
        await this.exportKeybindings();
        await this.exportSnippets();
        if (this.CanManageExtensions) {
            this.exportExtensions();
        }
        this.statusBar.reset();
    }

    importSettings(): void {
        if (this.Settings.Settings.importSettings) {
            this.logger.appendLine('Importing settings');
            this.startSync('Importing settings');
            let settingsPath: string = path.join(this.codeSyncDir, SETTINGS);
            if (!fs.existsSync(settingsPath)) {
                this.logger.appendLine(`Failed to import settings. Could not find settings.json at ${settingsPath}. Giving up.`);
                this.statusBar.reset();
                return;
            }
            if (helpers.isFileEmpty(settingsPath) == false &&
            helpers.isFileContentEmpty(settingsPath) == false) {
                this.localSettingsManager.import(settingsPath, helpers.getUserSettingsFilePath());
            }
            this.statusBar.reset();
            this.logger.appendLine('Finished importing settings.');
        }
    }

    exportSettings(): void {
        if (this.Settings.Settings.importSettings) {
            this.startSync('Exporting settings');
            if (!fs.existsSync(helpers.getUserSettingsFilePath())) {
                return;
            }
            this.localSettingsManager.export(helpers.getUserSettingsFilePath(), path.join(this.codeSyncDir, SETTINGS));
            this.statusBar.reset();
        }
    }

    async importKeybindings() {
        if (this.Settings.Settings.importKeybindings) {
            this.logger.appendLine('Importing keybindings');
            this.startSync('Importing keybindings');
            let keybindingsPath: string = path.join(this.codeSyncDir, KEYBINDINGS);
            if (!fs.existsSync(keybindingsPath)) {
                this.logger.appendLine(`Failed to import keybindings. Could not find keybindings.json at ${keybindingsPath}. Giving up.`);
                this.statusBar.reset();
                return;
            }
            if (helpers.isFileEmpty(keybindingsPath) == false &&
            helpers.isFileContentEmpty(keybindingsPath) == false) {
                await helpers.copy(keybindingsPath, helpers.getKeybindingsFilePath());
            }
            this.statusBar.reset();
            this.logger.appendLine('Finished importing keybindings.');
        }
    }

    async exportKeybindings() {
        if (this.Settings.Settings.importKeybindings) {
            this.startSync('Exporting keybindings');
            if (!fs.existsSync(helpers.getKeybindingsFilePath())) {
                return;
            }
            await helpers.copy(helpers.getKeybindingsFilePath(), path.join(this.codeSyncDir, KEYBINDINGS));
            this.statusBar.reset();
        }   
    }

    async importSnippets() {
        if (this.Settings.Settings.importSnippets) {
            this.logger.appendLine('Importing snippets');
            this.startSync('Importing snippets');
            let snippetsDirectory = path.join(this.codeSyncDir, SNIPPETS);
            if (!fs.existsSync(snippetsDirectory)) {
                this.logger.appendLine(`Failed to import snippets. Could not find snippets directory at ${snippetsDirectory}. Giving up.`);
                this.statusBar.reset();
                return;
            }
            let snippetFiles: string[] = fs.readdirSync(snippetsDirectory);
            for (let i = 0; i < snippetFiles.length; i++) {
                let s = snippetFiles[i];if (fs.lstatSync(path.join(snippetsDirectory, s)).isFile()) {
                    if (helpers.isFileEmpty(path.join(snippetsDirectory, s)) == false &&
                    helpers.isFileContentEmpty(path.join(snippetsDirectory, s)) == false) {
                        await helpers.copy(path.join(snippetsDirectory, s), path.join(helpers.getSnippetsFolderPath(), s));
                    }
                }
            }
            this.statusBar.reset();
            this.logger.appendLine('Finished importing snippets.');
        }
    }

    async exportSnippets() {
        if (this.Settings.Settings.importSnippets) {
            this.startSync('Exporting snippets');
            if (!fs.existsSync(helpers.getSnippetsFolderPath())) {
                return;
            }
            await helpers.copy(helpers.getSnippetsFolderPath(), path.join(this.codeSyncDir, SNIPPETS));
            this.statusBar.reset();
        }
    }

    importExtensions() {
        if (this.Settings.Settings.importExtensions) {
            this.logger.appendLine('Importing extensions');
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
            this.logger.appendLine('Finished importing extensions.');
        }
    }

    exportExtensions() {
        if (this.Settings.Settings.importExtensions) {
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
                            this.logger.appendLine(`Found version less than 2. Removing: ${tmpExtension.version}.`);
                            this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                            rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                        }
                    }
                    else {
                        this.logger.appendLine(`Could not split version. Removing: ${tmpExtension.version}.`);
                        this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                        rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                    }
                }
                else {
                    this.logger.appendLine(`Could not determine version. Removing ${path.join(this.vsCodeExtensionDir, f)}.`);
                    this.emptySyncDir(path.join(this.vsCodeExtensionDir, f, SETTINGS));
                    rimraf.sync(path.join(this.vsCodeExtensionDir, f));
                }
            }
        });
    }

    private async migrateSettings(): Promise<void> {
        let folders: string[] = fs.readdirSync(this.vsCodeExtensionDir);
        for (let i = 0; i < folders.length; i++) {
            let f = folders[i];
            let tmpExtension = helpers.getFolderExtensionInfo(f);
            if (tmpExtension.id == 'golf1052.code-sync') {
                if (tmpExtension.id == 'golf1052.code-sync' && helpers.isVersionGreaterThan(currentVersion, tmpExtension.version) == 1) {
                    this.logger.appendLine(`Migrating stuff. Previous version: ${tmpExtension.version}. Current version: ${currentVersion}.`);
                    if (fs.existsSync(path.join(this.vsCodeExtensionDir, f, SETTINGS))) {
                        this.logger.appendLine(`Migrating settings.`);
                        let oldSettings = path.join(this.vsCodeExtensionDir, f, SETTINGS);
                        let newSettings = path.join(codeSyncExtensionDir, SETTINGS);
                        this.logger.appendLine(`Previous file: ${oldSettings}. New file: ${newSettings}.`)
                        await helpers.copy(oldSettings, newSettings);
                    }
                    if (fs.existsSync(path.join(this.vsCodeExtensionDir, f, LOCAL_SETTINGS))) {
                        this.logger.appendLine(`Migrating local settings.`);
                        let oldLocalSettings = path.join(this.vsCodeExtensionDir, f, LOCAL_SETTINGS);
                        let newLocalSettings = path.join(codeSyncExtensionDir, LOCAL_SETTINGS);
                        this.logger.appendLine(`Previous file: ${oldLocalSettings}. New file: ${newLocalSettings}.`);
                        await helpers.copy(oldLocalSettings, newLocalSettings);
                    }
                }
            }
        }
    }

    private emptySyncDir(settingsFilePath: string) {
        let settings: any = null;
        if (fs.existsSync(settingsFilePath)) {
            settings = helpers.parseJson(fs.readFileSync(settingsFilePath, 'utf8'));
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
