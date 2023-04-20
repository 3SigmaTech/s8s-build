
import fs from 'fs';
import { paths } from './paths';

export function makeDirs() {
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
