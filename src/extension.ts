"use strict";
import * as vscode from 'vscode';
import * as codesync from './codesync';
import * as helpers from '../src/helpers';
import StatusBarManager = require('./status-bar-manager');
import * as os from 'os';

var currentVersion = '1.1.0';
var vsCodeExtensionDir: string = os.homedir() + '/.vscode/extensions';
var codeSyncExtensionDir: string = vsCodeExtensionDir + '/golf1052.code-sync-' + currentVersion;
var codeSync: codesync.CodeSync;

enum ExtensionLocation {
	Installed,
	External
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code-sync" is now active!');
    
    codeSync = new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, null);
	await codeSync.checkForSettings();
    await codeSync.importExtensions();
    
    
    let importExtensionsDisposable = vscode.commands.registerCommand('extension.importExtensions', async function() {
        await codeSync.importExtensions();
    });
    
	let exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', async function() {
        await codeSync.exportExtensions();
	});
	
	let listMissingInstalledDisposable = vscode.commands.registerCommand('extension.listMissingInstalled', async function() {
        codeSync.displayMissingPackages(await codeSync.getMissingPackagesFrom(codesync.ExtensionLocation.Installed));
	});
	
	let listMissingExternalDisposable = vscode.commands.registerCommand('extension.listMissingExternal', async function() {
        codeSync.displayMissingPackages(await codeSync.getMissingPackagesFrom(codesync.ExtensionLocation.External));
	});
    
    let listExcludedInstalledDisposable = vscode.commands.registerCommand('extension.listExcludedInstalled', () => {
        codeSync.displayExcludedPackages(codesync.ExtensionLocation.Installed);
    });
    
    let listExcludedExternalDisposable = vscode.commands.registerCommand('extension.listExcludedExternal', () => {
        codeSync.displayExcludedPackages(codesync.ExtensionLocation.External);
    });
    
    let addExcludedInstalledDisposable = vscode.commands.registerCommand('extension.addExcludedInstalled', () => {
        codeSync.addExcludedPackage(codesync.ExtensionLocation.Installed);
    });
    
    let addExcludedExternalDisposable = vscode.commands.registerCommand('extension.addExcludedExternal', () => {
        codeSync.addExcludedPackage(codesync.ExtensionLocation.External);
    });
    
    let removeExcludedInstalledDisposable = vscode.commands.registerCommand('extension.removeExcludedInstalled', () => {
        codeSync.removeExcludedPackage(codesync.ExtensionLocation.Installed);
    });
    
    let removeExcludedExternalDisposable = vscode.commands.registerCommand('extension.removeExcludedExternal', () => {
        codeSync.removeExcludedPackage(codesync.ExtensionLocation.External);
    });
	
    context.subscriptions.push(importExtensionsDisposable);
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
    // await codeSync.exportExtensions();
}
