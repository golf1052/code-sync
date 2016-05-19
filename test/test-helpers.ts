'use strict';

export function createFakePackage(): any {
    let fakePackage: any = {};
    fakePackage.name = 'fake-package';
    fakePackage.displayName = 'Fake Package';
    fakePackage.description = '';
    fakePackage.version = '1.2.3';
    fakePackage.publisher ='golf1052';
    return fakePackage;
}

export class TestHelper {
    private createdFolders: string[];
    
    constructor() {
        this.createdFolders = [];
    }
    
    get CreatedFolders(): string[] {
        return this.createdFolders;
    }
}