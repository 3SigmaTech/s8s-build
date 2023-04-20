
import fs from 'fs';
import gulp from 'gulp';
import replace from 'gulp-replace';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { paths } from './paths';

function makeDirs() {
    if (!fs.existsSync('./.github/workflows')) {
        fs.mkdirSync('./.github/workflows', { recursive: true });
    }
}

export const makeReleaseFlow = () => {
    console.log('Creating flow to create release from new tag.');

    makeDirs();
    return gulp.src(__dirname + '/bin/create_release.yml')
        .pipe(gulp.dest('./.github/workflows'));
}


export const makePackageFlow = () => {
    console.log('Creating flow to create package from new release.');
    console.log('ONLY USE FOR PUBLIC REPOS');
    
    makeDirs();
    const packageRegex = /\{\{PACKAGE\_NAME\}\}/g;

    const nameRegex = /"?name"?:\s*"(.*?)"/g;
    let pkgFile;
    if (fs.existsSync(paths.pkg)) {
        pkgFile = fs.readFileSync(paths.pkg, 'utf8');
    } else {
        pkgFile = fs.readFileSync('../package.json', 'utf8');
    }
    let pkgNm = pkgFile.matchAll(nameRegex);
    let packageName = '';
    for (const match of pkgNm) {
        if (match[1]) {
            packageName = match[1];
        }
    }

    let devpacktask = null;
    if (path.resolve(__dirname + '/bin/devpack.sh') != path.resolve('./bin/devpack.sh')) {
        devpacktask = gulp.src(__dirname + '/bin/devpack.sh')
            .pipe(gulp.dest('./bin'));
    }

    return Promise.all([
        gulp.src(__dirname + '/bin/release_package.yml')
            .pipe(gulp.dest('./.github/workflows')),
        gulp.src(__dirname + '/bin/scope_package.js')
            .pipe(replace(packageRegex, packageName))
            .pipe(gulp.dest('./.github/workflows')),
        devpacktask,
    ]);
}
