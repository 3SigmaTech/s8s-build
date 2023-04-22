
import fs from 'fs';
import { paths } from './paths';

export const makeDirs = () => {
    if (!fs.existsSync(paths.build + paths.vendor.dest)) {
        fs.mkdirSync(paths.build + paths.vendor.dest, { recursive: true });
    }
    if (!fs.existsSync(paths.build + paths.js.dest)) {
        fs.mkdirSync(paths.build + paths.js.dest, { recursive: true });
    }
    if (!fs.existsSync(paths.dist + paths.js.dest)) {
        fs.mkdirSync(paths.dist + paths.js.dest, { recursive: true });
    }
}

export const isIrrelevantFile = (flnm:string) => {
    if (!fs.existsSync(flnm)) {
        return true;
    }
    let file = fs.readFileSync(flnm, 'utf-8');
    
    let commentRegex = /\s*\/\/.*\n+/g;
    let multilineRegex = /\/\*([\s\S]*)?\*\//g;
    let blankRegex = /\s/g;

    file = file.replaceAll(commentRegex, '');
    file = file.replaceAll(multilineRegex, '');
    file = file.replaceAll(blankRegex, '');

    if (!file.length) {
        return true;
    }

    return false;
}