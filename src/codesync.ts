'use strict';
import * as vscode from 'vscode';
import * as helpers from './helpers';
import {StatusBarManager} from './status-bar-manager';
import * as os from 'os';
var fs = require('q-io/fs');
var copy = require('recursive-copy');

export enum ExtensionLocation {
    Installed,
    External
}

export interface FolderExtension {
    id: string;
    version: string;
}

export class ExternalExtension {
	extensionPath: string;
	id: string;
	version: string;
	isTheme: boolean;
	packageJSON: any;
}

export class MissingExtension {
	why: string;
	extension: any;
	constructor(w, e) {
		this.why = w;
		this.extension = e;
	}
}

export class CodeSync {
    private currentVersion: string;
    private vsCodeExtensionDir: string;
    private codeSyncExtensionDir: string;
    private codeSyncDir: string;
    private statusBarManager: StatusBarManager;
    
    constructor(currentVersion: string, vsCodeExtensionDir: string, codeSyncExtensionDir: string, codeSyncDir: string) {
        this.currentVersion = currentVersion;
        this.vsCodeExtensionDir = vsCodeExtensionDir;
        this.codeSyncExtensionDir = codeSyncExtensionDir;
        this.codeSyncDir = codeSyncDir;
        this.statusBarManager = new StatusBarManager();
    }
    
    async importExtensions() {
        this.statusBarManager.StatusBarText = 'CodeSync: Importing extensions';
        this.statusBarManager.setSync();
        let missing: any = await this.getMissingPackagesFrom(ExtensionLocation.Installed);
        let excluded: string[] = await this.getExcludedPackages(ExtensionLocation.External);
        let importedThings: string[] = [];
        for (let i: number = 0; i < missing.missing.length; i++) {
            if (excluded.indexOf(missing.missing[i].extension.id) == -1) {
                if (missing.missing[i].extension.isTheme) {
                    await this.saveExtensionToInstalled(missing.missing[i].extension);
                    let name: string = missing.missing[i].extension.packageJSON.displayName;
                    if (!name) {
                        name = missing.missing[i].extension.packageJSON.name;
                    }
                    importedThings.push(name);
                }
            }
        }
        
        if (importedThings.length > 0) {
            vscode.window.showInformationMessage('Imported extensions:');
            for (let i: number = 0; i < importedThings.length; i++) {
                vscode.window.showInformationMessage(importedThings[i]);
            }
            this.statusBarSetRestartStatus();
        }
        this.displayMissingPackages(await this.getMissingPackagesFrom(ExtensionLocation.Installed));
    }
    
    async exportExtensions() {
        this.statusBarManager.StatusBarText = 'CodeSync: Exporting extensions';
        this.statusBarManager.setSync();
        let missing: any = await this.getMissingPackagesFrom(ExtensionLocation.External);
        let excluded: string[] = await this.getExcludedPackages(ExtensionLocation.Installed);
        let importedThings: string[] = [];
        for (let i: number = 0; i < missing.missing.length; i++) {
            if (excluded.indexOf(missing.missing[i].extension.id) == -1) {
                await this.saveExtensionToExternal(missing.missing[i].extension);
                let name: string = missing.missing[i].extension.packageJSON.displayName;
                if (!name) {
                    name = missing.missing[i].extension.packageJSON.name;
                }
                importedThings.push(name);
            }
        }
        await this.removeExternalExtensionDuplicates();
        await this.cleanExternalExtensions();
        
        if (importedThings.length > 0) {
            vscode.window.showInformationMessage('Exported extensions:');
            for (let i: number = 0; i < importedThings.length; i++) {
                vscode.window.showInformationMessage(importedThings[i]);
            }
            this.statusBarSetGoodStatus();
        }
        else {
            this.statusBarManager.setTimer(() => {
                this.statusBarManager.StatusBarText = 'CodeSync: All extensions already exported';
                this.statusBarManager.setCheck();
            }, 5000, this.statusBarSetGoodStatus);
        }
    }
    
    async checkForSettings() {
        this.statusBarManager.StatusBarText = 'CodeSync: Checking settings';
        await helpers.makeSureDirectoryExists(this.codeSyncExtensionDir);
        // Migrate old settings.json file to new directory when upgrading
        let folders: string[] = await fs.list(this.vsCodeExtensionDir);
        for (let i: number = 0; i < folders.length; i++) {
            let tmpExtension: FolderExtension = this.getFolderExtensionInfo(folders[i]);
            if (tmpExtension.id == 'golf1052.code-sync' &&
            helpers.isVersionGreaterThan(this.currentVersion, tmpExtension.version) == 1) {
                if (await fs.exists(this.vsCodeExtensionDir + '/' + tmpExtension.id + '-' + tmpExtension.version + '/settings.json') == true) {
                    await fs.copy(this.vsCodeExtensionDir + '/' + tmpExtension.id + '-' + tmpExtension.version + '/settings.json', this.codeSyncExtensionDir + '/settings.json');
                    break;
                }
            }
        }
        if (await fs.exists(this.codeSyncExtensionDir + '/settings.json') == false) {
            let path: string = null;
            if (this.codeSyncDir == null) {
                path = await vscode.window.showInputBox({
                    prompt: 'Enter the full path to where you want CodeSync to sync your extensions',
                    value: os.homedir() + '/OneDrive/Apps/code-sync'
                });
            }
            else {
                path = this.codeSyncDir;
            }
            
            let tmpSettings = {
                externalPath: path,
                excluded: {
                    installed: [],
                    external: []
                }
            };
            await helpers.saveSettings(this.codeSyncExtensionDir, tmpSettings);
        }
        
        let settings = await helpers.getSettings(this.codeSyncExtensionDir);
        this.codeSyncDir = settings.externalPath;
        
        if (await fs.exists(this.codeSyncDir) == false) {
            await fs.makeTree(this.codeSyncDir);
        }
    }
    
    async saveExcludedPackages(excluded: string[], location: ExtensionLocation) {
        let settings = await helpers.getSettings(this.codeSyncExtensionDir);
        if (location == ExtensionLocation.Installed) {
            settings.excluded.installed = excluded;
        }
        else if (location == ExtensionLocation.External) {
            settings.excluded.external = excluded;
        }
        await helpers.saveSettings(this.codeSyncExtensionDir, settings);
    }
    
    async addExcludedPackage(location: ExtensionLocation) {
        let excluded: string[] = await this.getExcludedPackages(location);
        let items: vscode.QuickPickItem[] = [];
        if (location == ExtensionLocation.Installed) {
            let installed: vscode.Extension<any>[] = this.getInstalledExtensions();
            if (installed.length == 0) {
                vscode.window.showInformationMessage('There are no installed extensions.');
                return;
            }
            installed.forEach(extension => {
                if (excluded.indexOf(extension.id) == -1) {
                    let item: vscode.QuickPickItem = {
                        label: extension.id,
                        description: extension.packageJSON.description
                    };
                    items.push(item);
                }
            });
            
            if (items.length == 0) {
                vscode.window.showInformationMessage('All installed extensions excluded.');
                return;
            }
        }
        else if (location == ExtensionLocation.External) {
            let external: ExternalExtension[] = await this.getExternalExtensions();
            if (external.length == 0) {
                vscode.window.showInformationMessage('There are no external extensions.');
                return;
            }
            external.forEach(extension => {
                if (excluded.indexOf(extension.id) == -1) {
                    let item: vscode.QuickPickItem = {
                        label: extension.id,
                        description: extension.packageJSON.description
                    };
                    items.push(item);
                }
            });
            
            if (items.length == 0) {
                vscode.window.showInformationMessage('All external extensions excluded.');
                return;
            }
        }
        
        let result: vscode.QuickPickItem = await vscode.window.showQuickPick(items, {matchOnDescription: true});
        if (result) {
            excluded.push(result.label);
            await this.saveExcludedPackages(excluded, location);
            vscode.window.showInformationMessage('Successfully excluded package: ' + result.label);
        }
    }
    
    async removeExcludedPackage(location: ExtensionLocation) {
        let excluded: string[] = await this.getExcludedPackages(location);
        let items: vscode.QuickPickItem[] = [];
        excluded.forEach(str => {
            items.push({label: str, description: ''});
        });
        if (location == ExtensionLocation.Installed) {
            if (items.length == 0) {
                vscode.window.showInformationMessage('No installed extensions excluded.');
                return;
            }
        }
        else if (location == ExtensionLocation.External) {
            if (items.length == 0) {
                vscode.window.showInformationMessage('No external extensions excluded.');
                return;
            }
        }
        let result: vscode.QuickPickItem = await vscode.window.showQuickPick(items);
        if (result) {
            excluded.splice(excluded.indexOf(result.label), 1);
            await this.saveExcludedPackages(excluded, location);
            vscode.window.showInformationMessage('Successfully included package: ' + result.label);
        }
    }
    
    async displayExcludedPackages(location: ExtensionLocation) {
        let excluded: string[] = await this.getExcludedPackages(location);
        if (location == ExtensionLocation.Installed) {
            vscode.window.showInformationMessage('Excluded installed packages:');
            for (let i: number = 0; i < excluded.length; i++) {
                vscode.window.showInformationMessage(excluded[i]);
            }
        }
        else if (location == ExtensionLocation.External) {
            vscode.window.showInformationMessage('Excluded external packages:');
            for (let i: number = 0; i < excluded.length; i++) {
                vscode.window.showInformationMessage(excluded[i]);
            }
        }
    }
    
    async saveExtensionToInstalled(extension: ExternalExtension) {
        let installedExtensionsPath: string = this.vsCodeExtensionDir + '/' + extension.id + '-' + extension.version;
        if (await fs.exists(installedExtensionsPath) == false) {
            if (extension.isTheme) {
                await fs.makeTree(installedExtensionsPath);
            }
            else {
                return;
            }
        }
        let packageJSON: any = await this.tryGetPackageJson(installedExtensionsPath);
        if (packageJSON != null) {
            if (extension.id == packageJSON.id && extension.version == packageJSON.version) {
                return;
            }
        }
        if (extension.isTheme) {
            await copy(extension.extensionPath, installedExtensionsPath);
        }
        else {
            // don't know if copying non theme extensions will work
        }
    }
    
    async saveExtensionToExternal(extension: vscode.Extension<any>) {
        let externalExtensionPath: string = this.codeSyncDir + '/' + extension.id + '-' + extension.packageJSON.version;
        if (await fs.exists(externalExtensionPath) == false) {
            await fs.makeTree(externalExtensionPath);
        }
        let externalPackageInfo = await this.tryGetPackageJson(externalExtensionPath);
        if (externalPackageInfo != null) {
            if (extension.packageJSON.version == externalPackageInfo.version) {
                // versions are the same so return
                return;
            }
        }
        if (extension.packageJSON.contributes.themes) {
            await copy(extension.extensionPath, externalExtensionPath);
        }
        else {
            // just copy the package.json if it's something else
            await fs.copyTree(extension.extensionPath + '/package.json', externalExtensionPath + '/package.json');
        }
    }
    
    async getExcludedPackages(location: ExtensionLocation): Promise<string[]> {
        let settings = await helpers.getSettings(this.codeSyncExtensionDir);
        let value: string[] = [];
        if (location == ExtensionLocation.Installed) {
            value = settings.excluded.installed;
        }
        else if (location == ExtensionLocation.External) {
            value = settings.excluded.external;
        }
        return value;
    }
    
    /**
     * Given publisher.name-version returns a FolderExtension object with id = publisher.name and
     * version = version. If the folderName is malformed then id = folderName and version will be
     * an empty string
     */
    getFolderExtensionInfo(folderName: string): FolderExtension {
        let id: string = '';
        let version: string = '';
        if (folderName.lastIndexOf('-') != -1) {
            let tmpVersion = folderName.substring(folderName.lastIndexOf('-') + 1);
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
    
    statusBarSetGoodStatus() {
        this.statusBarManager.StatusBarText = 'CodeSync';
        this.statusBarManager.setCheck();
    }

    statusBarSetRestartStatus() {
        this.statusBarManager.StatusBarText = 'CodeSync: Restart required!';
        this.statusBarManager.setStop();
    }
    
    /*
    * External == Which installed packages are not reflected in external
    * Installed == Which external packages are not reflected in installed
    */
    async getMissingPackagesFrom(location: ExtensionLocation): Promise<any> {
        let installed: vscode.Extension<any>[] = this.getInstalledExtensions();
        let external: ExternalExtension[] = await this.getExternalExtensions();
        let r: any = {};
        if (location == ExtensionLocation.External) {
            let excluded: string[] = await this.getExcludedPackages(ExtensionLocation.Installed);
            r.which = ExtensionLocation.External;
            r.missing = [];
            for (let i = 0; i < installed.length; i++) {
                let found: boolean = false;
                let why: string = 'missing';
                for (let j = 0; j < external.length; j++) {
                    if (installed[i].id == external[j].id) {
                        if (installed[i].packageJSON.version == external[j].version) {
                            found = true;
                            installed.splice(i, 1);
                            external.splice(j, 1);
                            i--;
                            j--;
                            break;
                        }
                        else {
                            why = 'version';
                        }
                    }
                }
                if (!found) {
                    if (excluded.indexOf(installed[i].id) == -1) {
                        r.missing.push(new MissingExtension(why, installed[i]));
                    }
                }
            }
        }
        else if (location == ExtensionLocation.Installed) {
            let excluded: string[] = await this.getExcludedPackages(ExtensionLocation.External);
            r.which = ExtensionLocation.Installed;
            r.missing = [];
            for (let i = 0; i < external.length; i++) {
                let found: boolean = false;
                let why: string = 'missing';
                for (let j = 0; j < installed.length; j++) {
                    if (external[i].id == installed[j].id) {
                        if (external[i].version == installed[j].packageJSON.version) {
                            found = true;
                            external.splice(i, 1);
                            installed.splice(j, 1);
                            i--;
                            j--;
                            break;
                        }
                        else {
                            why = 'version';
                        }
                    }
                }
                if (!found) {
                    if (excluded.indexOf(external[i].id) == -1) {
                        r.missing.push(new MissingExtension(why, external[i]));
                    }
                }
            }
        }
        return r;
    }
    
    displayMissingPackages(m: any) {
        if (m.missing.length == 0) {
            if (m.which == ExtensionLocation.Installed) {
                this.statusBarManager.setTimer(() => {
                    this.statusBarManager.StatusBarText = 'CodeSync: No extensions missing from local';
                    this.statusBarManager.setCheck();
                }, 5000, this.statusBarSetGoodStatus);
            }
            else if (m.which == ExtensionLocation.External) {
                this.statusBarManager.setTimer(() => {
                    this.statusBarManager.StatusBarText = 'CodeSync: No extensions missing from external';
                    this.statusBarManager.setCheck();
                }, 5000, this.statusBarSetGoodStatus);
            }
        }
        else {
            if (m.which == ExtensionLocation.External) {
                this.statusBarManager.StatusBarText = 'CodeSync: Extensions missing from external';
                this.statusBarManager.setAlert();
                vscode.window.showInformationMessage('Extensions missing from external:');
            }
            else if (m.which == ExtensionLocation.Installed) {
                this.statusBarManager.StatusBarText = 'CodeSync: Extensions missing from installed';
                this.statusBarManager.setAlert();
                vscode.window.showInformationMessage('Extensions missing from installed:');
            }
            for (let i = 0; i < m.missing.length; i++) {
                let message: string = m.missing[i].extension.packageJSON.displayName;
                if (!message) {
                    message = m.missing[i].extension.id;
                }
                if (m.missing[i].why == 'missing') {
                    vscode.window.showInformationMessage(message);
                }
                else if (m.missing[i].why == 'version') {
                    vscode.window.showInformationMessage(message + ' - Outdated');
                }
            }
        }
    }
    
    getInstalledExtensions(): vscode.Extension<any>[] {
        let extensions: vscode.Extension<any>[] = [];
        extensions = vscode.extensions.all.filter(function (extension: any) {
            return extension.extensionPath.startsWith(os.homedir());
        });
        return extensions;
    }
    
    async getExternalExtensions(): Promise<ExternalExtension[]> {
        await this.removeExternalExtensionDuplicates();
        let folders: string[] = await fs.list(this.codeSyncDir);
        let externalExtensions: ExternalExtension[] = [];
        for (let i = 0; i < folders.length; i++) {
            let e = await this.loadExternalExtension(this.codeSyncDir + '/' + folders[i]);
            if (e != null) {
                externalExtensions.push(e);
            }
        }
        return externalExtensions;
    }
    
    async cleanExternalExtensions() {
        let folders: string[] = await fs.list(this.codeSyncDir);
        let markedForDeath: string[] = [];
        let extensions: vscode.Extension<any>[] = this.getInstalledExtensions();
        
        for (let i: number = 0; i < folders.length; i++) {
            let tmpExtension: FolderExtension = this.getFolderExtensionInfo(folders[i]);
            let packageJSON = await this.tryGetPackageJson(this.codeSyncDir + '/' + folders[i]);
            let foundPackage: boolean = false;
            for (let j: number = 0; j < extensions.length; j++) {
                if (packageJSON != null) {
                    if (extensions[j].id == packageJSON.publisher + '.' + packageJSON.name &&
                    helpers.isVersionGreaterThan(extensions[j].packageJSON.version, packageJSON.version) == 1) {
                        foundPackage = true;
                        break;
                    }
                }
                else {
                    if (tmpExtension.version != '') {
                        if (extensions[j].id == tmpExtension.id &&
                        helpers.isVersionGreaterThan(extensions[j].packageJSON.version, tmpExtension.version) == 1) {
                            foundPackage = true;
                            break;
                        }
                    }
                    else {
                        if (extensions[j].id == tmpExtension.id) {
                            foundPackage = true;
                            break;
                        }
                    }
                }
            }
            
            if (!foundPackage) {
                markedForDeath.push(folders[i]);
            }
        }
        
        for (let i: number = 0; i < markedForDeath.length; i++) {
            await fs.removeTree(this.codeSyncDir + '/' + markedForDeath[i]);
        }
    }
    
    async removeExternalExtensionDuplicates() {
        let folders: string[] = await fs.list(this.codeSyncDir);
        let extensions: any[] = [];
        let markedForDeath: string[] = [];
        
        for (let i: number = 0; i < folders.length; i++) {
            let tmpExtension: FolderExtension = this.getFolderExtensionInfo(folders[i]);
            let addedExtension: boolean = false;
            for (let j: number = 0; j < extensions.length; j++) {
                if (extensions[j].id == tmpExtension.id) {
                    if (helpers.isVersionGreaterThan(tmpExtension.version, extensions[j].version) == 1) {
                        let str: string = extensions[j].id;
                        if (extensions[j].version != '') {
                            str += '-' + extensions[j].version;
                        }
                        markedForDeath.push(str);
                        extensions.splice(j, 1);
                        extensions.push(tmpExtension);
                        addedExtension = true;
                        break;
                    }
                    else {
                        let str: string = tmpExtension.id;
                        if (tmpExtension.version != '') {
                            str += '-' + tmpExtension.version;
                        }
                        markedForDeath.push(str);
                        addedExtension = true;
                    }
                }
            }
            if (!addedExtension) {
                extensions.push(tmpExtension);
            }
        }
        
        for (let i: number = 0; i < markedForDeath.length; i++) {
            await fs.removeTree(this.codeSyncDir + '/' + markedForDeath[i]);
        }
    }
    
    async tryGetPackageJson(path: string): Promise<any> {
        if (await fs.exists(path + '/package.json')) {
            return JSON.parse(await fs.read(path + '/package.json'));
        }
        else {
            return null;
        }
    }
    
    async loadExternalExtension(path: string): Promise<ExternalExtension> {
        if (await fs.exists(path)) {
            let e: ExternalExtension = new ExternalExtension();
            e.packageJSON = await this.tryGetPackageJson(path);
            if (e.packageJSON == null) {
                return null;
            }
            e.extensionPath = path;
            e.id = e.packageJSON.publisher + '.' + e.packageJSON.name;
            e.version = e.packageJSON.version;
            if (e.packageJSON.contributes) {
                if (e.packageJSON.contributes.themes) {
                e.isTheme = true;
                }
                else {
                    e.isTheme = false;
                }
            }
            else {
                e.isTheme = false;
            }
            
            return e;
        }
        else {
            return null;
        }
    }
}
