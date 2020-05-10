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
    helpers.isCodeASnapPackage(codeSync.Settings.Settings, true);
    codeSync.CanManageExtensions = helpers.isCodeOnPath(codeSync.Settings.Settings);
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
            await codeSync.importSnippets();
            if (codeSync.CanManageExtensions) {
                codeSync.importExtensions();
                if (codeSync.Settings.Settings.autoExport) {
                    codeSync.exportExtensions();
                }
            }
        }
        codeSync.setStatusBarIcon();
    }

    let importAllDisposable = vscode.commands.registerCommand('codeSync.importAll', async function() {
        await codeSync.importAll();
    });
    let exportAllDisposable = vscode.commands.registerCommand('codeSync.exportAll', async function() {
        await codeSync.exportAll();
    });
    let importSettingsDisposable = vscode.commands.registerCommand('codeSync.importSettings', function() {
        codeSync.importSettings();
    });
    let exportSettingsDisposable = vscode.commands.registerCommand('codeSync.exportSettings', function() {
        codeSync.exportSettings();
    });
    let importKeybindingsDisposable = vscode.commands.registerCommand('codeSync.importKeybindings', async function() {
        await codeSync.importKeybindings();
    });
    let exportKeybindingsDisposable = vscode.commands.registerCommand('codeSync.exportKeybindings', async function() {
        await codeSync.exportKeybindings();
    });
    let importSnippetsDisposable = vscode.commands.registerCommand('codeSync.importSnippets', async function() {
        await codeSync.importSnippets();
    });
    let exportSnippetsDisposable = vscode.commands.registerCommand('codeSync.exportSnippets', async function() {
        await codeSync.exportSnippets();
    });
    let importExtensionsDisposable = vscode.commands.registerCommand('codeSync.importExtensions', function() {
        if (codeSync.CanManageExtensions) {
            codeSync.importExtensions();
        }
        else {
            vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
        }
    });
    let exportExtensionsDisposable = vscode.commands.registerCommand('codeSync.exportExtensions', function() {
        if (codeSync.CanManageExtensions) {
            codeSync.exportExtensions();
        }
        else {
            vscode.window.showWarningMessage(helpers.getCodePathWarningMessage());
        }
    });
    let listExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.listExcludedInstalled', function() {
        codeSync.displayExcludedInstalledPackages();
    });
    let listExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.listExcludedExternal', function() {
        codeSync.displayExcludedExternalPackages();
    });
    let addExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.addExcludedInstalled', async function() {
        await codeSync.addExcludedInstalledPackage();
    });
    let addExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.addExcludedExternal', async function() {
        await codeSync.addExcludedExternalPackage();
    });
    let removeExcludedInstalledDisposable = vscode.commands.registerCommand('codeSync.removeExcludedInstalled', async function() {
        await codeSync.removeExcludedInstalledPackage();
    });
    let removeExcludedExternalDisposable = vscode.commands.registerCommand('codeSync.removeExcludedExternal', async function() {
        await codeSync.removeExcludedExternalPackage();
    });
    let toggleAutoImportDisposable = vscode.commands.registerCommand('codeSync.toggleAutoImport', async function() {
        await codeSync.toggleSetting('autoImport', codeSync.Settings.Settings.autoImport);
    });
    let toggleAutoExportDisposable = vscode.commands.registerCommand('codeSync.toggleAutoExport', async function() {
        await codeSync.toggleSetting('autoExport', codeSync.Settings.Settings.autoExport);
    });
    let toggleImportSettingsDisposable = vscode.commands.registerCommand('codeSync.toggleImportSettings', async function() {
        await codeSync.toggleSetting('importSettings', codeSync.Settings.Settings.importSettings);
    });
    let toggleImportKeybindingsDisposable = vscode.commands.registerCommand('codeSync.toggleImportKeybindings', async function() {
        await codeSync.toggleSetting('importKeybindings', codeSync.Settings.Settings.importKeybindings);
    });
    let toggleImportSnippetsDisposable = vscode.commands.registerCommand('codeSync.toggleImportSnippets', async function() {
        await codeSync.toggleSetting('importSnippets', codeSync.Settings.Settings.importSnippets);
    });
    let toggleImportExtensionsDisposable = vscode.commands.registerCommand('codeSync.toggleImportExtensions', async function() {
        await codeSync.toggleSetting('importExtensions', codeSync.Settings.Settings.importExtensions);
    });
    let setSyncPathDisposable = vscode.commands.registerCommand('codeSync.setSyncPath', async function() {
        await codeSync.setExternalSyncPath();
    });
    let toggleStatusBarDisposable = vscode.commands.registerCommand('codeSync.toggleStatusBar', function() {
        codeSync.toggleStatusBarIcon();
    });
    const setCodeExecutableName = vscode.commands.registerCommand('codeSync.setCodeExecutableName', async function() {
        await codeSync.setCodeExecutableName();
    });
    const setCodeSettingsPath = vscode.commands.registerCommand('codeSync.setCodeSettingsPath', async function() {
        await codeSync.setCodeSettingsPath();
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
        setSyncPathDisposable,
        toggleStatusBarDisposable,
        setCodeExecutableName,
        setCodeSettingsPath
    );
}

export function deactivate() {
    if (codeSync.CanManageExtensions) {
        if (codeSync.Settings.Settings.autoExport) {
            codeSync.exportExtensions();
        }
    }
}
