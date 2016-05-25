'use strict';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as codesync from '../src/codesync';
import * as helpers from '../src/helpers';
import * as testHelpers from './test-helpers';
var fs: any = require('q-io/fs');

var currentVersion: string = '1.1.0';
var vsCodeExtensionDir: string = helpers.getHomeDirectory() + '/.vscode/extensions';
var codeSyncExtensionDir: string = helpers.getHomeDirectory() + '/Desktop/golf1052.code-sync-' + currentVersion;
var codeSyncSyncDir: string = helpers.getHomeDirectory() + '/Desktop/code-sync';

function setupCodeSync(): codesync.CodeSync {
    return new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, codeSyncSyncDir);
}

suite('Helper method tests', () => {
    test('null should be equal to null', () => {
        assert.equal(helpers.isVersionGreaterThan(null, null), 0);
    });
    test('null should be less than empty string', () => {
        assert.equal(helpers.isVersionGreaterThan(null, ''), -1);
    });
    test('empty string should be greater than null', () => {
        assert.equal(helpers.isVersionGreaterThan('', null), 1);
    });
    test('0.0.0 should be equal to 0.0.0', () => {
        assert.equal(helpers.isVersionGreaterThan('0.0.0', '0.0.0'), 0);
    });
    test('1 should be equal to 1.0', () => {
        assert.equal(helpers.isVersionGreaterThan('1', '1.0'), 0);
    });
    test('1.0.1 should be greater than 1.0', () => {
        assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0'), 1);
    });
    test('1.0.1 should be less than 1.0.2', () => {
        assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0.2'), -1);
    });
    test('2.0.1 should be greater than 1.0.2', () => {
        assert.equal(helpers.isVersionGreaterThan('2.0.1', '1.0.2'), 1);
    });
    test('0.0.1 should be less than 0.0.2', () => {
        assert.equal(helpers.isVersionGreaterThan('0.0.1', '0.0.2'), -1);
    });
    test('0.0.0.2 should be less than 0.0.1', () => {
        assert.equal(helpers.isVersionGreaterThan('0.0.0.2', '0.0.1'), -1);
    });
    // test('../../junk/testdir should exist and then should not exist', async () => {
    //     let directory: string = fs.absolute(__dirname + '../../junk/testdir');
    //     await helpers.makeSureDirectoryExists(directory);
    //     assert.equal(await fs.exists(directory), true);
    //     // await helpers.deleteDirectory(directory);
    //     // assert.equal(await fs.exists(directory), false);
    // });
});

suite('CodeSync Tests', function(): any {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup (async function (): Promise<any> {
        testHelper = new testHelpers.TestHelper();
        codeSync = setupCodeSync();
    });
    
    test('getInstalledExtensions', async function(): Promise<any> {
        let installedExtensions: vscode.Extension<any>[] = codeSync.getInstalledExtensions();
        assert.notEqual(installedExtensions, null);
    });
    
    test('getFolderExtensionInfo', function (): any {
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

suite('Try to get package.json', function(): void {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup(async function(): Promise<any> {
        testHelper = new testHelpers.TestHelper();
        codeSync = setupCodeSync();
        await codeSync.checkForSettings();
        testHelper.CreatedFolders.push(codeSyncExtensionDir, codeSyncSyncDir);
    });
    
    test('checkForSettings', async function(): Promise<void> {
        let extensions: vscode.Extension<any>[] = vscode.extensions.all;
        let settings: any = await helpers.getSettings(codeSyncExtensionDir);
        assert.equal(settings.externalPath, codeSyncSyncDir);
        
        let fakePackageJson: any = testHelpers.createFakePackage();
        let fakePackageFolderName: string = helpers.createPackageFolderName(fakePackageJson.publisher, fakePackageJson.name, fakePackageJson.version);
        let fakePackageFolder: string = codeSyncSyncDir + '/' + fakePackageFolderName;
        await helpers.makeSureDirectoryExists(fakePackageFolder);
        testHelper.CreatedFolders.push(fakePackageFolder);
        await fs.writeAsync(fakePackageFolder + '/package.json', JSON.stringify(fakePackageJson, null, 4));
        await codeSync.importExtensions();
        assert.equal(fs.existsSync(vsCodeExtensionDir + '/' + fakePackageFolderName), true);
        assert.equal(fs.existsSync(vsCodeExtensionDir + '/' + fakePackageFolderName + '/package.json'), true);
    });
    
    teardown(async function(): Promise<void> {
        for (let folder of testHelper.CreatedFolders) {
            await helpers.deleteDirectory(folder);
        }
    });
});

suite('Remove external extension duplicates', function (): void {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup(async function(): Promise<void> {
        testHelper = new testHelpers.TestHelper();
        codeSync = setupCodeSync();
        await codeSync.checkForSettings();
        testHelper.CreatedFolders.push(codeSyncExtensionDir, codeSyncSyncDir);
    });
    
    test('removeExternalExtensionDuplicates', async function(): Promise<void> {
        let fakePackage1FolderName: string = helpers.createPackageFolderName('golf1052', 'test', '1.0.0');
        let fakePackage1Folder: string = codeSyncSyncDir + '/' + fakePackage1FolderName;
        let fakePackage2FolerName: string = helpers.createPackageFolderName('golf1052', 'test', '2.0.0');
        let fakePackage2Folder: string = codeSyncSyncDir + '/' + fakePackage2FolerName;
        await helpers.makeSureDirectoryExists(fakePackage1Folder);
        await helpers.makeSureDirectoryExists(fakePackage2Folder);
        testHelper.CreatedFolders.push(fakePackage1Folder, fakePackage2Folder);
        let externalExtensions: string[] = await fs.listAsync(codeSyncSyncDir);
        assert.equal(externalExtensions.length, 2);
        await codeSync.removeExternalExtensionDuplicates();
        externalExtensions = await fs.listAsync(codeSyncSyncDir);
        assert.equal(externalExtensions.length, 1);
        let externalExtensionInfo: codesync.FolderExtension = codeSync.getFolderExtensionInfo(externalExtensions[0]);
        assert.equal(externalExtensionInfo.version, '2.0.0');
    });
    
    teardown(async function(): Promise<void> {
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
//         await fs.writeAsync(fakePackageFolder + '/package.json', JSON.stringify(fakePackageJson, null, 4));
//         await codeSync.importExtensions();
//         assert.equal(fs.existsSync(vsCodeExtensionDir + '/' + fakePackageFolderName), true);
//         assert.equal(fs.existsSync(vsCodeExtensionDir + '/' + fakePackageFolderName + '/package.json'), true);
//     });
    
//     teardown(async function() {
//         for (let folder of testHelper.CreatedFolders) {
//             await helpers.deleteDirectory(folder);
//         }
//     });
// });