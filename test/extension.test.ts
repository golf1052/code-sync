// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as codesync from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {
    test('isVersionGreaterThanTests', () => {
        assert.equal(0, codesync.isVersionGreaterThan(null, null));
        assert.equal(-1, codesync.isVersionGreaterThan(null, ''));
        assert.equal(1, codesync.isVersionGreaterThan('', null));
        assert.equal(0, codesync.isVersionGreaterThan('0.0.0', '0.0.0'));
        assert.equal(0, codesync.isVersionGreaterThan('1', '1.0'));
        assert.equal(1, codesync.isVersionGreaterThan('1.0.1', '1.0'));
        assert.equal(-1, codesync.isVersionGreaterThan('1.0.1', '1.0.2'));
        assert.equal(1, codesync.isVersionGreaterThan('2.0.1', '1.0.2'));
        assert.equal(-1, codesync.isVersionGreaterThan('0.0.1', '0.0.2'));
        assert.equal(-1, codesync.isVersionGreaterThan('0.0.0.2', '0.0.1'));
    });
});