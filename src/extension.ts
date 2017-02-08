'use strict';
import * as vscode from 'vscode';
import * as cs from './cs';
import * as helpers from './helpers';

var codeSync: cs.CodeSync;

export async function activate(context: vscode.ExtensionContext) {
    codeSync = new cs.CodeSync(cs.vsCodeExtensionDir, cs.codeSyncExtensionDir, '');
    let activate = helpers.isCodeOnPath();
    codeSync.Active = activate;
    if (codeSync.Active) {
        await codeSync.checkForSettings();
        if (codeSync.Settings.Settings.autoImport) {
            codeSync.importSettings();
            codeSync.importKeybindings();
            codeSync.importSnippets();
            codeSync.importExtensions();
        }
        codeSync.startFileWatcher();
    }
    else {
        await vscode.window.showErrorMessage('Code was not found on your path, CodeSync is unable to activate!');
        return;
    }

    let importAllDisposable = vscode.commands.registerCommand('extension.importAll', function() {
        codeSync.importAll();
    });
    let exportAllDisposable = vscode.commands.registerCommand('extension.exportAll', function() {
        codeSync.exportAll();
    });
    let importSettingsDisposable = vscode.commands.registerCommand('extension.importSettings', function() {
        codeSync.importSettings();
    });
    let exportSettingsDisposable = vscode.commands.registerCommand('extension.exportSettings', function() {
        codeSync.exportSettings();
    });
    let importKeybindingsDisposable = vscode.commands.registerCommand('extension.importKeybindings', function() {
        codeSync.importKeybindings();
    });
    let exportKeybindingsDisposable = vscode.commands.registerCommand('extension.exportKeybindings', function() {
        codeSync.exportKeybindings();
    });
    let importSnippetsDisposable = vscode.commands.registerCommand('extension.importSnippets', function() {
        codeSync.importSnippets();
    });
    let exportSnippetsDisposable = vscode.commands.registerCommand('extension.exportSnippets', function() {
        codeSync.exportSnippets();
    });
    let importExtensionsDisposable = vscode.commands.registerCommand('extension.importExtensions', function() {
        codeSync.importExtensions();
    });
    let exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', function() {
        codeSync.exportExtensions();
    });
    let listExcludedInstalledDisposable = vscode.commands.registerCommand('extension.listExcludedInstalled', function() {
        codeSync.displayExcludedInstalledPackages();
    });
    let listExcludedExternalDisposable = vscode.commands.registerCommand('extension.listExcludedExternal', function() {
        codeSync.displayExcludedExternalPackages();
    });
    let addExcludedInstalledDisposable = vscode.commands.registerCommand('extension.addExcludedInstalled', async function() {
        await codeSync.addExcludedInstalledPackage();
    });
    let addExcludedExternalDisposable = vscode.commands.registerCommand('extension.addExcludedExternal', async function() {
        await codeSync.addExcludedExternalPackage();
    });
    let removeExcludedInstalledDisposable = vscode.commands.registerCommand('extension.removeExcludedInstalled', async function() {
        await codeSync.removeExcludedInstalledPackage();
    });
    let removeExcludedExternalDisposable = vscode.commands.registerCommand('extension.removeExcludedExternal', async function() {
        await codeSync.removeExcludedExternalPackage();
    });
    let toggleAutoImportDisposable = vscode.commands.registerCommand('extension.toggleAutoImport', async function() {
        await codeSync.toggleSetting('autoImport', codeSync.Settings.Settings.autoImport);
    });
    let toggleAutoExportDisposable = vscode.commands.registerCommand('extension.toggleAutoExport', async function() {
        await codeSync.toggleSetting('autoExport', codeSync.Settings.Settings.autoExport);
    });
    let toggleImportSettingsDisposable = vscode.commands.registerCommand('extension.toggleImportSettings', async function() {
        await codeSync.toggleSetting('importSettings', codeSync.Settings.Settings.importSettings);
    });
    let toggleImportKeybindingsDisposable = vscode.commands.registerCommand('extension.toggleImportKeybindings', async function() {
        await codeSync.toggleSetting('importKeybindings', codeSync.Settings.Settings.importKeybindings);
    });
    let toggleImportSnippetsDisposable = vscode.commands.registerCommand('extension.toggleImportSnippets', async function() {
        await codeSync.toggleSetting('importSnippets', codeSync.Settings.Settings.importSnippets);
    });
    let toggleImportExtensionsDisposable = vscode.commands.registerCommand('extension.toggleImportExtensions', async function() {
        await codeSync.toggleSetting('importExtensions', codeSync.Settings.Settings.importExtensions);
    });
    let setSyncPathDisposable = vscode.commands.registerCommand('extension.setSyncPath', async function() {
        await codeSync.setExternalSyncPath();
    });

    context.subscriptions.push(
        importAllDisposable,
        exportAllDisposable,
        importSettingsDisposable,
        exportSettingsDisposable,
        importKeybindingsDisposable,
        exportKeybindingsDisposable,
        importSnippetsDisposable,
        exportSnippetsDisposable,
        importExtensionsDisposable,
        exportExtensionsDisposable,
        listExcludedInstalledDisposable,
        listExcludedExternalDisposable,
        addExcludedInstalledDisposable,
        addExcludedExternalDisposable,
        removeExcludedInstalledDisposable,
        removeExcludedExternalDisposable,
        toggleAutoImportDisposable,
        toggleAutoExportDisposable,
        toggleImportSettingsDisposable,
        toggleImportKeybindingsDisposable,
        toggleImportSnippetsDisposable,
        toggleImportExtensionsDisposable,
        setSyncPathDisposable
    );
}

export function deactivate() {
    if (codeSync.Active) {
        if (codeSync.Settings.Settings.autoExport) {
            codeSync.exportExtensions();
        }
    }
}
