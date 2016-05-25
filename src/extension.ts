'use strict';
import * as vscode from 'vscode';
import * as codesync from './codesync';
import * as helpers from './helpers';
import {StatusBarManager} from './status-bar-manager';
import * as os from 'os';

var currentVersion: string = '1.1.0';
// This is bad. https://github.com/Microsoft/vscode/issues/2741 will make this better.
var vsCodeExtensionDir: string = os.homedir() + '/.vscode/extensions';
var codeSyncExtensionDir: string = vsCodeExtensionDir + '/golf1052.code-sync-' + currentVersion;
var codeSync: codesync.CodeSync;

enum ExtensionLocation {
	Installed,
	External
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('Congratulations, your extension "code-sync" is now active!');
    
    codeSync = new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, null);
		
	await codeSync.checkForSettings();
    await codeSync.importExtensions();
    
    let importExtensionsDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.importExtensions', async function(): Promise<void> {
        await codeSync.importExtensions();
    });
    
	let exportExtensionsDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.exportExtensions', async function(): Promise<void> {
        await codeSync.exportExtensions();
	});
	
	let listMissingInstalledDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.listMissingInstalled', async function(): Promise<void> {
        codeSync.displayMissingPackages(await codeSync.getMissingPackagesFrom(ExtensionLocation.Installed));
	});
	
	let listMissingExternalDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.listMissingExternal', async function(): Promise<void> {
        codeSync.displayMissingPackages(await codeSync.getMissingPackagesFrom(ExtensionLocation.External));
	});
    
    let listExcludedInstalledDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.listExcludedInstalled', () => {
        codeSync.displayExcludedPackages(ExtensionLocation.Installed);
    });
    
    let listExcludedExternalDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.listExcludedExternal', () => {
        codeSync.displayExcludedPackages(ExtensionLocation.External);
    });
    
    let addExcludedInstalledDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.addExcludedInstalled', () => {
        codeSync.addExcludedPackage(ExtensionLocation.Installed);
    });
    
    let addExcludedExternalDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.addExcludedExternal', () => {
        codeSync.addExcludedPackage(ExtensionLocation.External);
    });
    
    let removeExcludedInstalledDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.removeExcludedInstalled', () => {
        codeSync.removeExcludedPackage(ExtensionLocation.Installed);
    });
    
    let removeExcludedExternalDisposable: vscode.Disposable = vscode.commands.registerCommand('extension.removeExcludedExternal', () => {
        codeSync.removeExcludedPackage(ExtensionLocation.External);
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

export async function deactivate(): Promise<void> {
    await codeSync.exportExtensions();
}
