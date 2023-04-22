
import fs from 'fs';

import { paths } from '../paths';
import * as helpers from './rolluphelpers';

export { visualizer } from 'rollup-plugin-visualizer';
export type { InputPluginOption } from 'rollup';

// Mark all packages included in vendor.ts as external
let globals:{[key:string]:string} = {};
let externals:string[] = [];
let vendorGlobals: { [key: string]: string } = {};
let vendorExternals: string[] = [];
const importRegex = /^(?:\/\/\s?)?import (\* as )?(.*) from ['"](.*)['"];/gm;
const skippedImportRegex = /\/\/\s?import (\* as )?(.*) from ['"](.*)['"];/g;

if (fs.existsSync(paths.vendor.src)) {
    const vendorFile = fs.readFileSync(paths.vendor.src, 'utf-8');

    let vendorImports = vendorFile.matchAll(importRegex);
    for (const vImport of vendorImports) {
        if (!vImport[2] || !vImport[3]) { continue; }
        globals[vImport[3]] = vImport[2];
        externals.push(vImport[3]);
    }

    vendorImports = vendorFile.matchAll(skippedImportRegex);
    for (const vImport of vendorImports) {
        if (!vImport[2] || !vImport[3]) { continue; }
        vendorGlobals[vImport[3]] = vImport[2];
        vendorExternals.push(vImport[3]);
    }
} else {
    // Mark ALL dependencies as external
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    externals = Object.keys(pkg.dependencies || {});
}

let publicTSconfig = '';
if (fs.existsSync(`./${paths.src}/tsconfig.json`)) {
    publicTSconfig = `./${paths.src}/tsconfig.json`;
} else if (fs.existsSync(`./tsconfig.json`)) {
    publicTSconfig = `./tsconfig.json`;
}

let outfileBuild = paths.build + paths.js.dest + paths.js.flnm;
let outfileDist = paths.dist + paths.js.dest + paths.js.flnm;
if (paths.js.flnm.indexOf('/') == -1) {
    outfileBuild = paths.build + '/' + paths.js.flnm;
    outfileDist = paths.dist + '/' + paths.js.flnm;
}

const devInputOpts: helpers.JSConfig = {
    isproduction: false,
    tsconfig: publicTSconfig,
    input: paths.js.src,
    src: paths.src,
    dest: paths.build,
    output: outfileBuild,
    externals:externals,
    globals:globals
}
export const [devInput, devOutput] = helpers.Input(devInputOpts);

const prodInputOpts: helpers.JSConfig = {
    isproduction: true,
    tsconfig: publicTSconfig,
    input: paths.js.src,
    src: paths.src,
    dest: paths.dist,
    output: outfileDist,
    externals: externals,
    globals: globals
}
export const [prodInput, prodOutput] = helpers.Input(prodInputOpts);




let vendorTSconfig = '';
if (fs.existsSync(`./${paths.vendor.dir}/tsconfig.json`)) {
    vendorTSconfig = `./${paths.vendor.dir}/tsconfig.json`;
}


const vendorDevInputOpts: helpers.JSConfig = {
    isproduction: false,
    tsconfig: vendorTSconfig,
    input: paths.vendor.src,
    src: paths.vendor.dir,
    dest: paths.build,
    output: paths.build + paths.vendor.dest + paths.vendor.flnm,
    externals: vendorExternals,
    globals: vendorGlobals
}
export const [vendorDevInput, vendorDevOutput] = helpers.Input(vendorDevInputOpts);


const vendorProdInputOpts: helpers.JSConfig = {
    isproduction: true,
    tsconfig: vendorTSconfig,
    input: paths.vendor.src,
    src: paths.vendor.dir,
    dest: paths.dist,
    output: paths.dist + paths.vendor.dest + paths.vendor.flnm,
    externals: vendorExternals,
    globals: vendorGlobals
}
export const [vendorProdInput, vendorProdOutput] = helpers.Input(vendorProdInputOpts);
