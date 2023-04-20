
import gulp from 'gulp';
import fs from 'fs';
import util from 'util';
import replace from 'gulp-replace';
// @ts-ignore
import git from 'gulp-git';
const gittag = util.promisify(git.tag);
const gitstatus = util.promisify(git.status);
const gitpush = util.promisify(git.push);

import { paths } from './paths';

const vRegex = /"?version"?:\s*"(.*?)"/g;

const tagToArr = (tag?: string): [number, number, number] => {
    let iArr: [number, number, number] = [0, 0, 0];
    if (!tag) {
        return iArr;
    }
    let sArr = tag.replace('v', '').split('.');
    iArr[0] = parseInt(sArr[0] ?? '0');
    iArr[1] = parseInt(sArr[1] ?? '0');
    iArr[2] = parseInt(sArr[2] ?? '0');
    return iArr;
}

const getTagVersion = () => {
    // Read latest tag
    let tags = fs.readdirSync('./.git/refs/tags');
    tags.sort(function (a: string, b: string) {
        let aArr = tagToArr(a);
        let bArr = tagToArr(b);
        if (!aArr || !bArr) {
            return 0;
        }
        if (aArr[0] > bArr[0] || aArr[1] > bArr[1] || aArr[2] > bArr[2]) {
            return -1;
        }
        return 1;
    });

    let tagVersion = tagToArr(tags[0]);
    console.log(`Found Tag Version ${tagVersion.join('.')}`);
    return tagVersion;

}

const getFileVersion = (flnm:string) => {

    let fileVersion = [0,0,0];
    if (fs.existsSync(flnm)) {
        let appFile = fs.readFileSync(flnm, 'utf8');
        let appV = appFile.matchAll(vRegex);
        fileVersion = [0, 0, 0];
        for (const match of appV) {
            fileVersion = tagToArr(match[1]);
            break;
        }
        if (!fileVersion) { return [0, 0, 0]; }
        console.log(`Found ${flnm} Version ${fileVersion.join('.')}`);
    }
    return fileVersion;
}

const maxVersion = (vA:number[], vB:number[]) => {
    if (vA.length != vB.length) {
        throw 'This function will only compare versions with the same specificity.';
    }
    for (let i = 0; i < vA.length; i++) {
        if (!vA[i]) { return vB; }
        if (!vB[i]) { return vA; }
        if ((vA[i] as number) > (vB[i] as number)) {
            return vA;
        } else if ((vA[i] as number) < (vB[i] as number)) {
            return vB;
        }
    }
    // Both are equal
    return vA;
}

const isEqual = (vA:number[], vB:number[]) => {
    if (vA.length != vB.length) {
        throw 'This function will only compare versions with the same specificity.'
    }
    for (let i = 0; i < vA.length; i++) {
        if (vA[i] != vB[i]) { return false; }
    }
    // Both are equal
    return true;
}

const isZero = (vA:number[]) => {
    for (let i = 0; i < vA.length; i++) {
        if (vA[i] != 0) { return false; }
    }
    return true;
}

export const increment = () => {

    let tagVersion = getTagVersion();
    
    // TODO: procedurally review array of files
    let appVersion = getFileVersion(`${paths.app}/${paths.serverscript}.ts`);
    let pkgVersion = getFileVersion(paths.pkg);

    
    let latest = maxVersion(tagVersion, appVersion);
    latest = maxVersion(latest, pkgVersion);

    // Currently listed versions match the latest release
    // Read: version has not been incremented
    let skipApp, skipPkg;
    if (isEqual(latest, tagVersion)) {
        latest[2] = ((latest[2] ?? 0) + 1);
    } else {
        if (isZero(appVersion)) {
            skipApp = true;
        } else if (isEqual(latest, appVersion)) {
            skipApp = true;
            console.log('App version already incremented');
        } else if (isEqual(latest, pkgVersion)) {
            skipPkg = true;
            console.log('Package version already incremented');
        }

        if (skipApp && skipPkg) {
            console.log('Version already incremented');
            return gulp.src(".");
        }
    }

    let latestStr = latest.join('.');

    let app, pkg;
    if (!skipApp) {
        console.log(`Incrementing version in app.ts from v${appVersion?.join('.')} to v${latestStr}`);
        app = gulp.src('./app/app.ts')
            .pipe(replace(vRegex, `version: "${latestStr}"`))
            .pipe(gulp.dest('./app/'));
    }
    if (!skipPkg) {
        console.log(`Incrementing version in package.json from v${pkgVersion?.join('.')} to v${latestStr}`);
        let gaeVregex = /--version v[\d\-]* /g;
        pkg = gulp.src('./package.json')
            .pipe(replace(vRegex, `"version": "${latestStr}"`))
            .pipe(replace(gaeVregex, `--version v${latest.join('-')} `))
            .pipe(gulp.dest('./'));
    }

    let fileUpdates: NodeJS.ReadWriteStream[] = [];
    if (app && pkg) {
        fileUpdates = [app, pkg];
    } else if (app) {
        fileUpdates = [app];
    } else if (pkg) {
        fileUpdates = [pkg];
    }
    if (fileUpdates.length > 0) {
        return Promise.all(fileUpdates).then(() => {
            return setTimeout(() => { addTag() }, 3000);
        });
    }
    throw new Error(
        'Function incrementVersion failed to define increment task.'
    );
};

const allowableChanges = [
    ' M app/app.ts\n M package.json\n',
    ' M app/app.ts\n',
    ' M package.json\n',
];

function addTag() {
    let pkgFile = fs.readFileSync('./package.json');
    let version = JSON.parse(pkgFile.toString())['version'];

    // TODO: Rearrange to put this check in front of incrementVersion
    return gitstatus({ args: '--porcelain' }).then((changes: any) => {
        if (!allowableChanges.includes(changes)) {
            console.log(' -- Detected changes -- ');
            console.log(changes);
            console.log(' --  -- ');
            throw new Error(
                'Task addTag can only be run on a clean repository. '
                + 'Run "git status --porcelain" to see what blocked the task.'
            );
        }
        return new Promise(function (resolve, _reject) {
            gulp.src(['./app/app.ts', './package.json'])
                .pipe(git.add())
                .pipe(git.commit('Update version'))
                .on('end', resolve);
        });
    }).then(() => {
        return gittag('v' + version, "New version");
    }).then(() => {
        return gitpush('origin', 'main');
    }).then(() => {
        return gitpush('origin', 'main', { args: " --tags" });
    }).catch((err: any) => {
        if (err) {
            console.log(err);
            throw err;
        }
    });
}