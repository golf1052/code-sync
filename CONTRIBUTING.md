# Contributing

## Testing and Building

I typically test this extension with the Node LTS version. As of 2020-10-10 that is 12.19.0.

When prepping a new version don't change the version number in [`package.json`](./package.json) AND [`src/cs.ts`](./src/cs.ts) until you're done with all your changes. If you want to modify/test settings migration upon a new version change the version number while working on changes.

### Running Tests

`npm test`

See [this tip](https://code.visualstudio.com/api/working-with-extensions/testing-extension#using-insiders-version-for-extension-development) about running tests on the console if VSCode is already running.

Add new tests as necessary, leave test results at least the same or better than you found them before committing.

## Pushing Changes

Make sure you've updated the version number in [`package.json`](./package.json) AND [`src/cs.ts`](./src/cs.ts).

## Publishing Changes

1. `vsce package`
2. `vsce publish`
3. `ovsx publish <latest .vsix> -p <Open VSX token>`
