"use strict";

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
import * as fs from 'q-io/fs';

var currentVersion: string = '1.1.0';
var vsCodeExtensionDir: string = helpers.getHomeDirectory() + '/.vscode/extensions';
var codeSyncExtensionDir: string = helpers.getHomeDirectory() + '/Desktop/golf1052.code-sync-' + currentVersion;
var codeSyncSyncDir: string = helpers.getHomeDirectory() + '/Desktop/code-sync';

// Defines a Mocha test suite to group tests of similar kind together
suite("Helper Tests", () => {
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
    setup(async function() {
        codeSync = new codesync.CodeSync(currentVersion, vsCodeExtensionDir, codeSyncExtensionDir, codeSyncSyncDir);
        await codeSync.checkForSettings();
    });
    
    test('test', function() {
        assert.equal(true, true);
    });
    
    teardown(async function() {
        await helpers.deleteDirectory(codeSyncExtensionDir);
        await helpers.deleteDirectory(codeSyncSyncDir);
    });
});
