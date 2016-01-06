"use strict";
import * as vscode from 'vscode';
import * as helpers from '../src/helpers';
import StatusBarManager = require('./status-bar-manager');
var os = require('os');
var fs = require('q-io/fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

var currentVersion = '1.1.0';
var vsCodeExtensionDir: string = os.homedir() + '/.vscode/extensions';
var codeSyncExtensionDir: string = vsCodeExtensionDir + '/golf1052.code-sync-' + currentVersion;
var codeSyncDir: string;
var statusBarManager: StatusBarManager;

enum ExtensionLocation {
	Installed,
	External
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code-sync" is now active!');
    
    statusBarManager = new StatusBarManager();
	await checkForSettings();
    await importExtensions();
    
    
    let importExtensionsDisposable = vscode.commands.registerCommand('extension.importExtensions', async function() {
        await importExtensions();
    });
    
	let exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', async function() {
        await exportExtensions();
	});
	
	let listMissingInstalledDisposable = vscode.commands.registerCommand('extension.listMissingInstalled', async function() {
        displayMissingPackages(await getMissingPackagesFrom(ExtensionLocation.Installed));
	});
	
	let listMissingExternalDisposable = vscode.commands.registerCommand('extension.listMissingExternal', async function() {
        displayMissingPackages(await getMissingPackagesFrom(ExtensionLocation.External));
	});
    
    let listExcludedInstalledDisposable = vscode.commands.registerCommand('extension.listExcludedInstalled', () => {
        displayExcludedPackages(ExtensionLocation.Installed);
    });
    
    let listExcludedExternalDisposable = vscode.commands.registerCommand('extension.listExcludedExternal', () => {
        displayExcludedPackages(ExtensionLocation.External);
    });
    
    let addExcludedInstalledDisposable = vscode.commands.registerCommand('extension.addExcludedInstalled', () => {
        addExcludedPackage(ExtensionLocation.Installed);
    });
    
    let addExcludedExternalDisposable = vscode.commands.registerCommand('extension.addExcludedExternal', () => {
        addExcludedPackage(ExtensionLocation.External);
    });
    
    let removeExcludedInstalledDisposable = vscode.commands.registerCommand('extension.removeExcludedInstalled', () => {
        removeExcludedPackage(ExtensionLocation.Installed);
    });
    
    let removeExcludedExternalDisposable = vscode.commands.registerCommand('extension.removeExcludedExternal', () => {
        removeExcludedPackage(ExtensionLocation.External);
    });
	
	context.subscriptions.push(exportExtensionsDisposable);
	context.subscriptions.push(listMissingInstalledDisposable);
	context.subscriptions.push(listMissingExternalDisposable);
    context.subscriptions.push(listExcludedInstalledDisposable);
    context.subscriptions.push(listExcludedExternalDisposable);
    context.subscriptions.push(addExcludedInstalledDisposable);
    context.subscriptions.push(addExcludedExternalDisposable);
    context.subscriptions.push(removeExcludedInstalledDisposable);
    context.subscriptions.push(removeExcludedExternalDisposable);
}

export async function deactivate() {
    await exportExtensions();
}

async function importExtensions() {
    statusBarManager.StatusBarText = 'CodeSync: Importing extensions';
    statusBarManager.setSync();
    let missing: any = await getMissingPackagesFrom(ExtensionLocation.Installed);
    let excluded: string[] = await getExcludedPackages(ExtensionLocation.External);
    let importedThings: string[] = [];
    for (let i: number = 0; i < missing.missing.length; i++) {
        if (excluded.indexOf(missing.missing[i].extension.id) == -1) {
            if (missing.missing[i].extension.isTheme) {
                await saveExtensionToInstalled(missing.missing[i].extension);
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
        statusBarManager.StatusBarText = 'CodeSync: Restart required!';
        statusBarManager.setStop();
    }
    displayMissingPackages(await getMissingPackagesFrom(ExtensionLocation.Installed));
}

async function exportExtensions() {
    statusBarManager.StatusBarText = 'CodeSync: Exporting extensions';
    statusBarManager.setSync();
    let missing: any = await getMissingPackagesFrom(ExtensionLocation.External);
    let excluded: string[] = await getExcludedPackages(ExtensionLocation.Installed);
    let importedThings: string[] = [];
    for (let i: number = 0; i < missing.missing.length; i++) {
        if (excluded.indexOf(missing.missing[i].extension.id) == -1) {
            await saveExtensionToExternal(missing.missing[i].extension);
            let name: string = missing.missing[i].extension.packageJSON.displayName;
            if (!name) {
                name = missing.missing[i].extension.packageJSON.name;
            }
            importedThings.push(name);
        }
    }
    await removeExternalExtensionDuplicates();
    await cleanExternalExtensions();
    
    if (importedThings.length > 0) {
        vscode.window.showInformationMessage('Exported extensions:');
        for (let i: number = 0; i < importedThings.length; i++) {
            vscode.window.showInformationMessage(importedThings[i]);
        }
    }
    else {
        vscode.window.showInformationMessage('All extensions already exported.');
    }
}

async function getSettings(): Promise<any> {
    return JSON.parse(await fs.read(codeSyncExtensionDir + '/settings.json'));
}

async function saveSettings(settings: any) {
    await fs.write(codeSyncExtensionDir + '/settings.json', JSON.stringify(settings, null, 4));
}

async function checkForSettings() {
    statusBarManager.StatusBarText = 'CodeSync: Checking settingss';
	if (await fs.exists(codeSyncExtensionDir) == false) {
		await fs.makeDirectory(codeSyncExtensionDir);
	}
    // Migrate old settings.json file to new directory when upgrading
    let folders: string[] = await fs.list(vsCodeExtensionDir);
    for (let i: number = 0; i < folders.length; i++) {
        let tmpExtension: FolderExtension = getFolderExtensionInfo(folders[i]);
        if (tmpExtension.id == 'golf1052.code-sync' &&
        helpers.isVersionGreaterThan(currentVersion, tmpExtension.version) == 1) {
            if (await fs.exists(vsCodeExtensionDir + '/' + tmpExtension.id + '-' + tmpExtension.version + '/settings.json') == true) {
                await fs.copy(vsCodeExtensionDir + '/' + tmpExtension.id + '-' + tmpExtension.version + '/settings.json', codeSyncExtensionDir + '/settings.json');
                break;
            }
        }
    }
	if (await fs.exists(codeSyncExtensionDir + '/settings.json') == false) {
		let path: string = await vscode.window.showInputBox({
			prompt: 'Enter the full path to where you want CodeSync to sync your extensions',
			value: os.homedir() + '/OneDrive/Apps/code-sync'
		});
		let tmpSettings = {
			externalPath: path,
            excluded: {
                installed: [],
                external: []
            }
		};
		await saveSettings(tmpSettings);
	}
	
	let settings = await getSettings();
	codeSyncDir = settings.externalPath;
    
    if (await fs.exists(codeSyncDir) == false) {
        await fs.makeDirectory(codeSyncDir);
    }
}

async function getExcludedPackages(location: ExtensionLocation): Promise<string[]> {
    let settings = await getSettings();
    let value: string[] = [];
    if (location == ExtensionLocation.Installed) {
        value = settings.excluded.installed;
    }
    else if (location == ExtensionLocation.External) {
        value = settings.excluded.external;
    }
    return value;
}

async function saveExcludedPackages(excluded: string[], location: ExtensionLocation) {
    let settings = await getSettings();
    if (location == ExtensionLocation.Installed) {
        settings.excluded.installed = excluded;
    }
    else if (location == ExtensionLocation.External) {
        settings.excluded.external = excluded;
    }
    await saveSettings(settings);
}

async function addExcludedPackage(location: ExtensionLocation) {
    let excluded: string[] = await getExcludedPackages(location);
    let items: vscode.QuickPickItem[] = [];
    if (location == ExtensionLocation.Installed) {
        let installed: vscode.Extension<any>[] = getInstalledExtensions();
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
        let external: ExternalExtension[] = await getExternalExtensions();
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
        await saveExcludedPackages(excluded, location);
        vscode.window.showInformationMessage('Successfully excluded package: ' + result.label);
    }
}

async function removeExcludedPackage(location: ExtensionLocation) {
    let excluded: string[] = await getExcludedPackages(location);
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
        await saveExcludedPackages(excluded, location);
        vscode.window.showInformationMessage('Successfully included package: ' + result.label);
    }
}

async function displayExcludedPackages(location: ExtensionLocation) {
    let excluded: string[] = await getExcludedPackages(location);
    if (location == ExtensionLocation.Installed) {
        vscode.window.showInformationMessage('Excluded installed packages:')
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

function displayMissingPackages(m: any) {
    if (m.missing.length == 0) {
        if (m.which == ExtensionLocation.Installed) {
            statusBarManager.setTimer(() => {
                statusBarManager.StatusBarText = 'CodeSync: No extensions missing from local';
                statusBarManager.setCheck();
            }, 5000, statusBarSetGoodStatus);
        }
        else if (m.which == ExtensionLocation.External) {
            statusBarManager.setTimer(() => {
                statusBarManager.StatusBarText = 'CodeSync: No extensions missing from external';
                statusBarManager.setCheck();
            }, 5000, statusBarSetGoodStatus);
        }
    }
    else {
        if (m.which == ExtensionLocation.External) {
            statusBarManager.StatusBarText = 'CodeSync: Extensions missing from external';
            statusBarManager.setAlert();
            vscode.window.showInformationMessage('Extensions missing from external:');
        }
        else if (m.which == ExtensionLocation.Installed) {
            statusBarManager.StatusBarText = 'CodeSync: Extensions missing from installed';
            statusBarManager.setAlert();
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

function statusBarSetGoodStatus() {
    statusBarManager.StatusBarText = 'CodeSync';
    statusBarManager.setCheck();
}

function getInstalledExtensions(): vscode.Extension<any>[] {
	let extensions: vscode.Extension<any>[] = [];
	vscode.extensions.all.forEach(extention => {
		if (extention.extensionPath.startsWith(os.homedir())) {
			extensions.push(extention);
		}
	});
	return extensions;
}

interface FolderExtension {
    id: string,
    version: string
}

function getFolderExtensionInfo(folderName: string): FolderExtension {
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

async function removeExternalExtensionDuplicates() {
    let folders: string[] = await fs.list(codeSyncDir);
    let extensions: any[] = [];
    let markedForDeath: string[] = [];
    
    for (let i: number = 0; i < folders.length; i++) {
        let tmpExtension: FolderExtension = getFolderExtensionInfo(folders[i]);
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
        await fs.removeTree(codeSyncDir + '/' + markedForDeath[i]);
    }
}

async function cleanExternalExtensions() {
    let folders: string[] = await fs.list(codeSyncDir);
    let markedForDeath: string[] = [];
    let extensions: vscode.Extension<any>[] = getInstalledExtensions();
    
    for (let i: number = 0; i < folders.length; i++) {
        let tmpExtension: FolderExtension = getFolderExtensionInfo(folders[i]);
        let packageJSON = await tryGetPackageJson(codeSyncDir + '/' + folders[i]);
        let foundPackage: boolean = false;
        for (let j: number = 0; j < extensions.length; j++) {
            if (packageJSON != null) {
                if (extensions[j].id == packageJSON.publisher + '.' + packageJSON.name &&
                extensions[j].packageJSON.version == packageJSON.version) {
                    foundPackage = true;
                    break;
                }
            }
            else {
                if (tmpExtension.version != '') {
                    if (extensions[j].id == tmpExtension.id &&
                    extensions[j].packageJSON.version == tmpExtension.version) {
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
        await fs.removeTree(codeSyncDir + '/' + markedForDeath[i]);
    }
}

async function getExternalExtensions(): Promise<ExternalExtension[]> {
    await removeExternalExtensionDuplicates();
	let folders: string[] = await fs.list(codeSyncDir);
	let externalExtensions: ExternalExtension[] = [];
	for (let i = 0; i < folders.length; i++) {
		let e = await loadExternalExtension(codeSyncDir + '/' + folders[i]);
		if (e != null) {
			externalExtensions.push(e);
		}
	}
	return externalExtensions;
}

async function saveExtensionToInstalled(extension: ExternalExtension) {
    let installedExtensionsPath: string = vsCodeExtensionDir + '/' + extension.id + '-' + extension.version;
    if (await fs.exists(installedExtensionsPath) == false) {
        if (extension.isTheme) {
            await fs.makeDirectory(installedExtensionsPath);
        }
        else {
            return;
        }
    }
    let packageJSON: any = await tryGetPackageJson(installedExtensionsPath);
    if (packageJSON != null) {
        if (extension.id == packageJSON.id && extension.version == packageJSON.version) {
            return;
        }
    }
    if (extension.isTheme) {
        ncp(extension.extensionPath, installedExtensionsPath, function (err) {
            if (err) {
                console.log('Error while copying themes extension to installed: ' + err);
            }
            else {
                console.log('Copying theme extension to installed completed successfully');
            }
        });
    }
    else {
        // don't know if copying non theme extensions will work
    }
}

async function saveExtensionToExternal(extension: vscode.Extension<any>) {
	let externalExtensionPath: string = codeSyncDir + '/' + extension.id + '-' + extension.packageJSON.version;
	if (await fs.exists(externalExtensionPath) == false) {
		await fs.makeDirectory(externalExtensionPath);
	}
	let externalPackageInfo = await tryGetPackageJson(externalExtensionPath);
	if (externalPackageInfo != null) {
		if (extension.packageJSON.version == externalPackageInfo.version) {
			// versions are the same so return
			return;
		}
	}
	if (extension.packageJSON.contributes.themes) {
		ncp(extension.extensionPath, externalExtensionPath, function (err) {
			if (err) {
				console.log('Error while copying themes extension to external: ' + err);
			}
			else {
				console.log('Copying theme extension to external completed successfully');
			}
		});
	}
	else {
		// just copy the package.json if it's something else
		await fs.copyTree(extension.extensionPath + '/package.json', externalExtensionPath + '/package.json');
	}
}

class MissingExtension {
	why: string;
	extension: any;
	constructor(w, e) {
		this.why = w;
		this.extension = e;
	}
}

/*
* External == Which installed packages are not reflected in external
* Installed == Which external packages are not reflected in installed
*/
async function getMissingPackagesFrom(location: ExtensionLocation): Promise<any> {
	let installed: vscode.Extension<any>[] = getInstalledExtensions();
	let external: ExternalExtension[] = await getExternalExtensions();
	let r: any = {};
	if (location == ExtensionLocation.External) {
        let excluded: string[] = await getExcludedPackages(ExtensionLocation.Installed);
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
        let excluded: string[] = await getExcludedPackages(ExtensionLocation.External);
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

async function tryGetPackageJson(path: string): Promise<any> {
	if (await fs.exists(path + '/package.json')) {
		return JSON.parse(await fs.read(path + '/package.json'));
	}
	else {
		return null;
	}
}

class ExternalExtension {
	extensionPath: string;
	id: string;
	version: string;
	isTheme: boolean;
	packageJSON: any;
}

async function loadExternalExtension(path: string): Promise<ExternalExtension> {
	if (await fs.exists(path)) {
		let e: ExternalExtension = new ExternalExtension();
		e.packageJSON = await tryGetPackageJson(path);
		if (e.packageJSON == null) {
			return null;
		}
		e.extensionPath = path;
		e.id = e.packageJSON.publisher + '.' + e.packageJSON.name;
		e.version = e.packageJSON.version;
		if (e.packageJSON.contributes.themes) {
			e.isTheme = true;
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