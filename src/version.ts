
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
import { allPossibleCombinations } from './helpers';

const versionedFiles = [
    `./${paths.app}/${paths.serverscript}.ts`,
    paths.pkg,
    //paths.pkg.replace(/\.json/,"-lock.json")
];

// TODO: UPDATE REGEX AND HOW IT IS USED TO REPLACE VERSIONS
// REGEX TO ACCOMMODATE GCLOUD APP VERSION:
// const vRegex = /(")?version(")?:?\s*(v)?(")?((\d+(\.|-))*\d+)(")?/g; 
const vRegex = /(")?version(")?:\s*"(.*?)"/g;



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

const getFileVersion = (flnm: string) => {

    let m1 = '', m2 = '';
    let fileVersion = [0, 0, 0];
    if (fs.existsSync(flnm)) {
        let appFile = fs.readFileSync(flnm, 'utf8');
        let appV = appFile.matchAll(vRegex);
        fileVersion = [0, 0, 0];
        for (const match of appV) {
            m1 = match[1] ?? '';
            m2 = match[2] ?? '';
            fileVersion = tagToArr(match[3]);
            break;
        }
        if (!fileVersion) { return [0, 0, 0]; }
        console.log(`Found ${flnm} Version ${fileVersion.join('.')}`);
    }
    return [m1, m2, fileVersion];
}

const maxVersion = (vA: number[], vB: number[]) => {
    if (vA.length != vB.length) {
        throw 'This function will only compare versions with the same specificity.';
    }
    for (let i = 0; i < vA.length; i++) {
        if (!vA[i]) { return [...vB]; }
        if (!vB[i]) { return [...vA]; }
        if ((vA[i] as number) > (vB[i] as number)) {
            return [...vA];
        } else if ((vA[i] as number) < (vB[i] as number)) {
            return [...vB];
        }
    }
    // Both are equal
    return [...vA];
}

const isEqual = (vA: number[], vB: number[]) => {
    if (vA.length != vB.length) {
        throw 'This function will only compare versions with the same specificity.'
    }
    for (let i = 0; i < vA.length; i++) {
        if (vA[i] != vB[i]) { return false; }
    }
    // Both are equal
    return true;
}

const isZero = (vA: number[]) => {
    for (let i = 0; i < vA.length; i++) {
        if (vA[i] != 0) { return false; }
    }
    return true;
}

export const increment = () => {

    let tagVersion = getTagVersion();

    //
    // Retrieve the version from each versioned file
    //
    let fileContext: string[][] = []; // "version" or version
    let fileVersions: number[][] = [];
    for (let i = 0; i < versionedFiles.length; i++) {
        let flnm = versionedFiles[i];
        if (!flnm) {
            throw 'We are missing a file in code? What??';
        }
        let fmeta = getFileVersion(flnm);
        fileContext.push([fmeta[0] as string, fmeta[1] as string]);
        fileVersions.push(fmeta[2] as number[]);
    }

    //
    // Find the max version across all files
    //
    let latest = [...tagVersion];
    for (let i = 0; i < fileVersions.length; i++) {
        let flVer = fileVersions[i];
        if (!flVer) {
            throw 'We are missing a file version.';
        }
        latest = maxVersion(latest, flVer);
    }

    //
    // Increment the max version if equal to the tag version
    // (The tag version is our source of truth)
    //
    if (isEqual(latest, tagVersion)) {
        latest[2] = ((latest[2] ?? 0) + 1);
        console.log(`Incrementing patch release version to ${latest[2]}.`);
    }
    let latestStr = latest.join('.');

    //
    // Cross reference new version with version in each file
    //
    let skipUpdates: boolean[] = [];
    for (let i = 0; i < fileVersions.length; i++) {
        let skip = false;
        let flVer = fileVersions[i];
        if (!flVer) {
            throw 'We are missing a file version (but not before??).';
        }
        if (isZero(flVer)) {
            skip = true;
            console.log(`File does not exist: ${versionedFiles[i]}`);
        } else if (isEqual(latest, flVer)) {
            skip = true;
            console.log(`Version already incremented in ${versionedFiles[i]}`);
        }
        skipUpdates.push(skip);
    }

    //
    // Check if there are any files to update
    //
    let numSkips = 0;
    for (let i = 0; i < skipUpdates.length; i++) {
        if (skipUpdates[i]) {
            numSkips++;
        }
    }
    if (numSkips == skipUpdates.length) {
        console.log('Version already incremented in all files');
        return gulp.src(".");
    }

    //
    // Apply the new version to each versioned file
    //
    let fileUpdates: NodeJS.ReadWriteStream[] = [];
    for (let i = 0; i < fileVersions.length; i++) {
        if (skipUpdates[i]) { continue; }
        let flnm = versionedFiles[i];
        if (!flnm) {
            throw 'We are missing a file in code? How did we get here??';
        }
        console.log(`Incrementing version in ${flnm} `
            + `from v${fileVersions[i]?.join('.')} to v${latestStr}`
        );

        let path = flnm.substring(0, flnm.lastIndexOf("/") + 1);
        let q0 = fileContext[i]?.[0], q1 = fileContext[i]?.[1];
        console.log(`    Replacing ${q0}version${q1}: "${latestStr}"`);
        let flUpdate = gulp.src(flnm)
            .pipe(replace(vRegex, `${q0}version${q1}: "${latestStr}"`))
            .pipe(gulp.dest(path));

        fileUpdates.push(flUpdate);
    }

    //
    // Execute all updates in a promise
    //
    if (fileUpdates.length > 0) {
        return Promise.all(fileUpdates).then(() => {
            return setTimeout(() => { addTag() }, 5000);
        });
    }
    throw new Error(
        'Function incrementVersion failed to define increment task.'
    );
};

function addTag() {
    let pkgFile = fs.readFileSync('./package.json');
    let version = JSON.parse(pkgFile.toString())['version'];

    // Create a list of all allowable changes we will push to git
    let gitChanges = versionedFiles.map((s) => {
        return ` M ${s.replace('./', '') }\n`;
    });
    let allowableChanges = allPossibleCombinations(gitChanges);
    for (let i = 0; i < allowableChanges.length; i++) {
        allowableChanges[i] = allowableChanges[i].join('');
    }

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
            let files = [];
            for (let i = 0; i < versionedFiles.length; i++) {
                let flnm = versionedFiles[i];
                if (!flnm) { continue; }
                if (fs.existsSync(flnm)) {
                    files.push(flnm);
                }
            }
            gulp.src(files)
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