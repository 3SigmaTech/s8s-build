import fs from 'fs';

let VENDOR_SRC = 'vendor';
let FRONT_SRC = 'public';
let FRONT_DIST = 'dist';
let FRONT_BUILD = 'build';
let BACK_SRC = 'app';
let BACK_DIST = 'server';

const checkDown = (curr:string, next:string) => {
    if (!fs.existsSync('./' + curr)) {
        console.log(`Changing configured directory from ${curr} to ${next}.`);
        return next;
    }
    return curr;
}

FRONT_SRC = checkDown(FRONT_SRC, 'src');

export const paths = {
    pkg: './package.json',
    app: BACK_SRC,
    serverscript: 'app',
    server: BACK_DIST,
    dist: FRONT_DIST,
    build: FRONT_BUILD,
    src: FRONT_SRC,
    ejs: {
        src: './views/**'
    },
    vendor: {
        dir: VENDOR_SRC,
        src: VENDOR_SRC + '/vendor.ts',
        src2: [
            VENDOR_SRC + '/**/*.js',
            VENDOR_SRC + '/**/*.ts',
            VENDOR_SRC + '/**/*.jsx',
            VENDOR_SRC + '/**/*.tsx'
        ],
        dest: '/js',
        flnm: '/vendor.js'

    },
    js: {
        src: FRONT_SRC + '/js/index.ts',
        src2: [
            FRONT_SRC + '/js/**/*.js',
            FRONT_SRC + '/js/**/*.ts',
            FRONT_SRC + '/jsx/**/*.jsx',
            FRONT_SRC + '/jsx/**/*.tsx'
        ],
        map: FRONT_SRC + '/js/importmap.json',
        dest: '/js',
        flnm: '/main.js'
    },
    jsx: {
        src: FRONT_SRC + '/jsx/**/*',
        dest: '/jsx'
    },
    css: {
        src: [FRONT_SRC + '/style/styles.scss', FRONT_SRC + '/style/**/*.css'],
        src2: FRONT_SRC + '/style/**/*.{scss,css}',
        dest: '/style'
    },
    img: {
        src: [FRONT_SRC + '/img/**/*', '!' + FRONT_SRC + '/img/Unused*/**/*'],
        dest: '/img'
    },
    fonts: {
        src: FRONT_SRC + '/fonts/**/*',
        dest: '/fonts'
    },
    data: {
        src: FRONT_SRC + '/data/**/*',
        dest: '/data'
    }
}

// Allow for index file in main source directory
paths.js.src = checkDown(paths.js.src, FRONT_SRC + '/index.ts');