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
import * as fs from 'q-io/fs';

var currentVersion: string = '1.1.0';
var vsCodeExtensionDir: string = helpers.getHomeDirectory() + '/.vscode/extensions';
var codeSyncExtensionDir: string = helpers.getHomeDirectory() + '/Desktop/golf1052.code-sync-' + currentVersion;
var codeSyncSyncDir: string = helpers.getHomeDirectory() + '/Desktop/code-sync';

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', () => {
    test('isVersionGreaterThanTests', () => {
        assert.equal(0, helpers.isVersionGreaterThan(null, null));
        assert.equal(-1, helpers.isVersionGreaterThan(null, ''));
        assert.equal(1, helpers.isVersionGreaterThan('', null));
        assert.equal(0, helpers.isVersionGreaterThan('0.0.0', '0.0.0'));
        assert.equal(0, helpers.isVersionGreaterThan('1', '1.0'));
        assert.equal(1, helpers.isVersionGreaterThan('1.0.1', '1.0'));
        assert.equal(-1, helpers.isVersionGreaterThan('1.0.1', '1.0.2'));
        assert.equal(1, helpers.isVersionGreaterThan('2.0.1', '1.0.2'));
        assert.equal(-1, helpers.isVersionGreaterThan('0.0.1', '0.0.2'));
        assert.equal(-1, helpers.isVersionGreaterThan('0.0.0.2', '0.0.1'));
    });
});

suite('CodeSync Tests', function() {
    let codeSync: codesync.CodeSync;
    let testHelper: testHelpers.TestHelper;
    setup(async function() {
        testHelper = new testHelpers.TestHelper();
        codeSync = new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, codeSyncSyncDir);
        await codeSync.checkForSettings();
        testHelper.CreatedFolders.push(codeSyncExtensionDir);
        testHelper.CreatedFolders.push(codeSyncSyncDir);
    });
    
    test('checkForSettings', async function() {
        let settings = await helpers.getSettings(codeSyncExtensionDir);
        console.log(settings);
        assert.equal(codeSyncSyncDir, settings.externalPath);
        
        let fakePackageJson: any = testHelpers.createFakePackage();
        let fakePackageFolder: string = vsCodeExtensionDir + '/' + helpers.createPackageFolderName(fakePackageJson.publisher, fakePackageJson.name, fakePackageJson.version);
        await helpers.makeSureDirectoryExists(fakePackageFolder);
        testHelper.CreatedFolders.push(fakePackageFolder);
        await fs.write(fakePackageFolder + '/package.json', JSON.stringify(fakePackageJson, null, 4));
        console.log('done');
    });
    
    teardown(async function() {
        for (let folder of testHelper.CreatedFolders) {
            await helpers.deleteDirectory(folder);
        }
    });
});