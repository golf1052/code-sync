'use strict';
import * as vscode from 'vscode';
import * as cs from './cs';
import * as helpers from './helpers';
import {Logger} from './logger';

var logger: Logger;
var codeSync: cs.CodeSync;

export async function activate(context: vscode.ExtensionContext) {
    logger = new Logger('extension');
    codeSync = new cs.CodeSync(cs.vsCodeExtensionDir, cs.codeSyncExtensionDir, '');
    codeSync.CanManageExtensions = helpers.isCodeOnPath();
    if (!codeSync.CanManageExtensions) {
        await vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
    }
    codeSync.Active = true;
    if (codeSync.Active) {
        await codeSync.checkForSettings();
        codeSync.startFileWatcher();
        if (codeSync.Settings.Settings.autoImport) {
            codeSync.importSettings();
            await codeSync.importKeybindings();
            codeSync.importSnippets();
            if (codeSync.CanManageExtensions) {
                codeSync.importExtensions();
            }
        }
    }

    let importAllDisposable = vscode.commands.registerCommand('extension.importAll', async function() {
        await codeSync.importAll();
    });
    let exportAllDisposable = vscode.commands.registerCommand('extension.exportAll', async function() {
        await codeSync.exportAll();
    });
    let importSettingsDisposable = vscode.commands.registerCommand('extension.importSettings', function() {
        codeSync.importSettings();
    });
    let exportSettingsDisposable = vscode.commands.registerCommand('extension.exportSettings', function() {
        codeSync.exportSettings();
    });
    let importKeybindingsDisposable = vscode.commands.registerCommand('extension.importKeybindings', async function() {
        await codeSync.importKeybindings();
    });
    let exportKeybindingsDisposable = vscode.commands.registerCommand('extension.exportKeybindings', async function() {
        await codeSync.exportKeybindings();
    });
    let importSnippetsDisposable = vscode.commands.registerCommand('extension.importSnippets', function() {
        codeSync.importSnippets();
    });
    let exportSnippetsDisposable = vscode.commands.registerCommand('extension.exportSnippets', async function() {
        await codeSync.exportSnippets();
    });
    let importExtensionsDisposable = vscode.commands.registerCommand('extension.importExtensions', function() {
        if (codeSync.CanManageExtensions) {
            codeSync.importExtensions();
        }
        else {
            vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
        }
    });
    let exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', function() {
        if (codeSync.CanManageExtensions) {
            codeSync.exportExtensions();
        }
        else {
            vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
        }
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
    if (codeSync.CanManageExtensions) {
        if (codeSync.Settings.Settings.autoExport) {
            codeSync.exportExtensions();
        }
    }
}
