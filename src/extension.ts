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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-sync" is now active!');
		
	await checkForSettings();
	let installedExtensions: vscode.Extension<any>[] = getInstalledExtensions();
	for (let i: number = 0; i < installedExtensions.length; i++) {
		await saveExtensionToExternal(installedExtensions[i]);
	}
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

async function saveExtensionToExternal(extension: vscode.Extension<any>) {
	let externalExtensionPath: string = codeSyncDir + '/' + extension.id;
	if (await fs.exists(externalExtensionPath) == false) {
		await fs.makeDirectory(codeSyncDir + '/' + extension.id);
	}
	let externalPackageInfo = await tryGetExternalPackageJson(externalExtensionPath + '/package.json');
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

async function tryGetExternalPackageJson(path: string) {
	if (await fs.exists(path)) {
		return JSON.parse(await fs.read(path));
	}
	else {
		return null;
	}
}