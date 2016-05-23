'use strict';
// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as codesync from '../src/codesync';
import * as helpers from '../src/helpers';
import * as testHelpers from './test-helpers';
var fs = require('q-io/fs');

var currentVersion: string = '1.1.0';
var vsCodeExtensionDir: string = helpers.getHomeDirectory() + '/.vscode/extensions';
var codeSyncExtensionDir: string = helpers.getHomeDirectory() + '/Desktop/golf1052.code-sync-' + currentVersion;
var codeSyncSyncDir: string = helpers.getHomeDirectory() + '/Desktop/code-sync';

function setupCodeSync(): codesync.CodeSync {
    return new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, codeSyncSyncDir);
}

suite('Extension Tests', () => {
    test('isVersionGreaterThanTests', () => {
        assert.equal(helpers.isVersionGreaterThan(null, null), 0);
        assert.equal(helpers.isVersionGreaterThan(null, ''), -1);
        assert.equal(helpers.isVersionGreaterThan('', null), 1);
        assert.equal(helpers.isVersionGreaterThan('0.0.0', '0.0.0'), 0);
        assert.equal(helpers.isVersionGreaterThan('1', '1.0'), 0);
        assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0'), 1);
        assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0.2'), -1);
        assert.equal(helpers.isVersionGreaterThan('2.0.1', '1.0.2'), 1);
        assert.equal(helpers.isVersionGreaterThan('0.0.1', '0.0.2'), -1);
        assert.equal(helpers.isVersionGreaterThan('0.0.0.2', '0.0.1'), -1);
    });
});

suite('CodeSync Tests', function() {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup (async function () {
        testHelper = new testHelpers.TestHelper();
        codeSync = setupCodeSync();
    });
    
    test('getInstalledExtensions', async function() {
        let installedExtensions: vscode.Extension<any>[] = codeSync.getInstalledExtensions();
        assert.notEqual(installedExtensions, null);
    });
    
    test('getFolderExtensionInfo', function () {
        let goodFolderName: string = 'golf1052.test-1.0.0';
        let goodFolderExtension: codesync.FolderExtension = codeSync.getFolderExtensionInfo(goodFolderName);
        assert.equal(goodFolderExtension.id, 'golf1052.test');
        assert.equal(goodFolderExtension.version, '1.0.0');
        let badFolderName: string = 'test';
        let badFolderExtension: codesync.FolderExtension = codeSync.getFolderExtensionInfo(badFolderName);
        assert.equal(badFolderExtension.id, 'test');
        assert.equal(badFolderExtension.version, '');
    });
});

suite('Remove external extension duplicates', function () {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup(async function() {
        testHelper = new testHelpers.TestHelper();
        codeSync = setupCodeSync();
        await codeSync.checkForSettings();
        testHelper.CreatedFolders.push(codeSyncExtensionDir, codeSyncSyncDir);
    });
    
    test('removeExternalExtensionDuplicates', async function() {
        let fakePackage1FolderName: string = helpers.createPackageFolderName('golf1052', 'test', '1.0.0');
        let fakePackage1Folder: string = codeSyncSyncDir + '/' + fakePackage1FolderName;
        let fakePackage2FolerName: string = helpers.createPackageFolderName('golf1052', 'test', '2.0.0');
        let fakePackage2Folder: string = codeSyncSyncDir + '/' + fakePackage2FolerName;
        await helpers.makeSureDirectoryExists(fakePackage1Folder);
        await helpers.makeSureDirectoryExists(fakePackage2Folder);
        testHelper.CreatedFolders.push(fakePackage1Folder, fakePackage2Folder);
        let externalExtensions: string[] = await fs.list(codeSyncSyncDir);
        assert.equal(externalExtensions.length, 2);
        await codeSync.removeExternalExtensionDuplicates();
        externalExtensions = await fs.list(codeSyncSyncDir);
        assert.equal(externalExtensions.length, 1);
        let externalExtensionInfo: codesync.FolderExtension = codeSync.getFolderExtensionInfo(externalExtensions[0]);
        assert.equal(externalExtensionInfo.version, '2.0.0');
    });
    
    teardown(async function() {
        for (let folder of testHelper.CreatedFolders) {
            await helpers.deleteDirectory(folder);
        }
    });
});

// suite('getExternalExtensions', function () {
    
// });

// suite('CodeSync Tests', function() {
//     let codeSync: codesync.CodeSync;
//     let testHelper: testHelpers.TestHelper;
//     setup(async function() {
//         testHelper = new testHelpers.TestHelper();
//         codeSync = setupCodeSync();
//         await codeSync.checkForSettings();
//         testHelper.CreatedFolders.push(codeSyncExtensionDir, codeSyncSyncDir);
//     });
    
//     test('checkForSettings', async function() {
//         let extensions: vscode.Extension<any>[] = vscode.extensions.all;
//         let settings = await helpers.getSettings(codeSyncExtensionDir);
//         assert.equal(settings.externalPath, codeSyncSyncDir);
        
//         let fakePackageJson: any = testHelpers.createFakePackage();
//         let fakePackageFolderName = helpers.createPackageFolderName(fakePackageJson.publisher, fakePackageJson.name, fakePackageJson.version);
//         let fakePackageFolder: string = codeSyncSyncDir + '/' + fakePackageFolderName;
//         await helpers.makeSureDirectoryExists(fakePackageFolder);
//         testHelper.CreatedFolders.push(fakePackageFolder);
//         await fs.write(fakePackageFolder + '/package.json', JSON.stringify(fakePackageJson, null, 4));
//         await codeSync.importExtensions();
//         assert.equal(await fs.exists(vsCodeExtensionDir + '/' + fakePackageFolderName), true);
//         assert.equal(await fs.exists(vsCodeExtensionDir + '/' + fakePackageFolderName + '/package.json'), true);
//     });
    
//     teardown(async function() {
//         for (let folder of testHelper.CreatedFolders) {
//             await helpers.deleteDirectory(folder);
//         }
//     });
// });