"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var request = require('request');
var os = require('os');
var fs = require('q-io/fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

var vsCodeExtDir: string = os.homedir() + '/.vscode/extensions';
var codeSyncExtDir: string = vsCodeExtDir + '/golf1052.code-sync';
var codeSyncDir: string;

enum ExtensionLocation {
	Installed,
	External
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-sync" is now active!');
		
	await checkForSettings();
	let e = await getMissingPackagesFrom(ExtensionLocation.External);
	displayMissingPackages(e);
	// let installedExtensions: vscode.Extension<any>[] = getInstalledExtensions();
	// for (let i: number = 0; i < installedExtensions.length; i++) {
	// 	await saveExtensionToExternal(installedExtensions[i]);
	// }
	// fs.access(vsCodeExtensionsDir, fs.R_OK, function (err) {
	// 	console.log(err ? 'no access' : 'can read');
	// });
	
	// fs.access(codeSyncDir, fs.R_OK | fs.W_OK, function (err) {
	// 	if (err) {
	// 		fs.mkdirSync(codeSyncDir);
	// 	}
	// });
	// ncp(vsCodeExtensionsDir, codeSyncDir, function (err) {
	// 	if (err) {
	// 		console.log(err);
	// 	}
	// 	else {
	// 		console.log('copy completed successfully');
	// 	}
	// });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', () => {
		// Display a message box to the user
		vscode.window.showInformationMessage('Extensions Exported!');
	});
	
	context.subscriptions.push(exportExtensionsDisposable);
}

function displayMissingPackages(m: any) {
	let message: string = '';
	if (m.which == ExtensionLocation.External) {
		message = 'Extensions missing from external: ';
	}
	else if (m.which == ExtensionLocation.Installed) {
		message = 'Extensions missing from installed: ';
	}
	for (let i = 0; i < m.missing.length; i++) {
		if (m.missing[i].why == 'missing') {
			message += m.missing[i].extension.packageJSON.name + '; ';
		}
		else if (m.missing[i].why == 'version') {
			message += m.missing[i].extension.packageJSON.name + ' - Outdated; ';
		}
	}
	vscode.window.showInformationMessage(message);
}

async function checkForSettings() {
	if (await fs.exists(codeSyncExtDir) == false) {
		await fs.makeDirectory(codeSyncExtDir);
	}
	if (await fs.exists(codeSyncExtDir + '/settings.json') == false) {
		let path: string = await vscode.window.showInputBox({
			prompt: 'Enter the full path to where you want code-sync to sync your extensions',
			value: os.homedir() + '/OneDrive/Apps/code-sync'
		});
		let tmpSettings = {
			externalPath: path
		};
		await fs.write(codeSyncExtDir + '/settings.json', JSON.stringify(tmpSettings));
	}
	
	let settings = JSON.parse(await fs.read(codeSyncExtDir + '/settings.json'));
	codeSyncDir = settings.externalPath;
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

async function getExternalExtensions(): Promise<ExternalExtension[]> {
	let folders: string[] = await fs.list(codeSyncDir);
	let externalExtensions: ExternalExtension[] = [];
	for (let i = 0; i < folders.length; i++) {
		let e = await loadExternalExtension(codeSyncDir + '/'+ folders[i]);
		if (e != null) {
			externalExtensions.push(e);
		}
	}
	return externalExtensions;
}

async function saveExtensionToExternal(extension: vscode.Extension<any>) {
	let externalExtensionPath: string = codeSyncDir + '/' + extension.id;
	if (await fs.exists(externalExtensionPath) == false) {
		await fs.makeDirectory(codeSyncDir + '/' + extension.id);
	}
	let externalPackageInfo = await tryGetExternalPackageJson(externalExtensionPath);
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
async function getMissingPackagesFrom(which: ExtensionLocation): Promise<any> {
	let installed = getInstalledExtensions();
	let external = await getExternalExtensions();
	let r: any = {};
	if (which == ExtensionLocation.External) {
		r.which = ExtensionLocation.External;
		r.missing = [];
		for (let i = 0; i < installed.length; i++) {
			let found: boolean = false;
			let why: string = '';
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
						why = 'version'
					}
				}
				else {
					why = 'missing'
				}
			}
			if (!found) {
				r.missing.push(new MissingExtension(why, installed[i]));
			}
		}
	}
	else if (which == ExtensionLocation.Installed) {
		r.which = ExtensionLocation.Installed;
		r.missing = [];
		for (let i = 0; i < external.length; i++) {
			let found: boolean = false;
			let why: string = '';
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
				else {
					why = 'missing';
				}
			}
			if (!found) {
				r.missing.push(new MissingExtension(why, external[i]));
			}
		}
	}
	return r;
}

async function tryGetExternalPackageJson(path: string) {
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
		e.packageJSON = await tryGetExternalPackageJson(path);
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