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
import * as helpers from '../src/helpers';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {
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