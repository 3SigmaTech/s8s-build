
import gulp from 'gulp';
//@ts-ignore
import nodemon from 'gulp-nodemon';
import fs from 'fs';

import bs from 'browser-sync';
const browserSync = bs.create();

// CSS builder
import gulpSass from 'gulp-sass';
import nodeSass from 'node-sass';
const sass = gulpSass(nodeSass);
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';

// Javascript builder
import ts from 'gulp-typescript';
import * as rollup from 'rollup';

import { paths } from './paths.js';
import * as rollupConfig from './rollup/rollupbase.js';
import * as version from './version';
import * as helpers from './helpers';
import * as flows from './flows';


export function vendorjs() {
    return _vendorjsbase(false);
}
function _vendorjslive() {
    return _vendorjsbase(true);
}
function _vendorjsbase(iswatching?:boolean) {
    // Because of how Rollup externals are automatically
    // parsed from the vendor file, it might exist
    // but be irrelevant (all comments).
    if (helpers.isIrrelevantFile(paths.vendor.src)) {
        return new Promise<void>((resolve) => resolve());
    }

    helpers.makeDirs();

    let devRollup = rollup.rollup(rollupConfig.vendorDevInput)
        .then((bundle) => bundle.write(rollupConfig.vendorDevOutput));

    if (iswatching) {
        return devRollup;
    }

    let prodRollup = rollup.rollup(rollupConfig.vendorProdInput)
        .then((bundle) => bundle.write(rollupConfig.vendorProdOutput));

    return Promise.all([devRollup, prodRollup]);
}


export function js() {
    return _jsbase(false);
}
function _jslive() {
    return _jsbase(true);
}
function _jsbase(iswatching?:boolean) {
    helpers.makeDirs();

    let devRollup = rollup.rollup(rollupConfig.devInput)
        .then(bundle => bundle.write(rollupConfig.devOutput));

    if (iswatching) {
        return devRollup;
    }

    let prodRollup = rollup.rollup(rollupConfig.prodInput)
        .then(bundle => bundle.write(rollupConfig.prodOutput));

    return Promise.all([devRollup, prodRollup]);
}

export function visualizejs() {
    helpers.makeDirs();

    let prodInput = rollupConfig.prodInput;
    (prodInput.plugins as rollupConfig.InputPluginOption[])
        .push(rollupConfig.visualizer);
        
    let devRollup = rollup.rollup(rollupConfig.devInput)
        .then(bundle => bundle.write(rollupConfig.devOutput));
    let prodRollup = rollup.rollup(prodInput)
        .then(bundle => bundle.write(rollupConfig.prodOutput));

    return Promise.all([devRollup, prodRollup]);

}



export function css() {
    return _cssbase(false);
}
function _csslive() {
    return _cssbase(true);
}
function _cssbase(iswatching?:boolean) {

    if (!fs.existsSync(paths.css.src[0] as string)) {
        return new Promise<void>((resolve) => resolve());
    }

    let devCSS = gulp.src(paths.css.src)
        .pipe(sass({
                includePaths: ['node_modules']
            }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(paths.build + paths.css.dest));
    
    if (iswatching) {
        return devCSS;
    }
    let prodCSS = gulp.src(paths.css.src)
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['node_modules']
        }).on('error', sass.logError))
        .pipe(gulp.dest(paths.dist + paths.css.dest));
    
    return Promise.all([devCSS, prodCSS]);
}

export function statics() {
    return Promise.all([
        gulp.src(paths.img.src)
            .pipe(gulp.dest(paths.build + paths.img.dest))
            .pipe(gulp.dest(paths.dist + paths.img.dest)),
        gulp.src(paths.fonts.src)
            .pipe(gulp.dest(paths.build + paths.fonts.dest))
            .pipe(gulp.dest(paths.dist + paths.fonts.dest)),
        gulp.src(paths.data.src)
            .pipe(gulp.dest(paths.build + paths.data.dest))
            .pipe(gulp.dest(paths.dist + paths.data.dest))
    ]);
}

function browsersyncReload(cb: any) {
    browserSync.reload();
    if (cb) {
        cb();
    }
}

function _watch() {
    // TODO: find port to proxy in app.ts file
    browserSync.init({
        open: false,
        proxy: "http://localhost:4987/", // what nodemon starts
        port: 3000 // what you access in the browser
    });

    gulp.watch(paths.js.src2,
        gulp.series(_jslive, browsersyncReload)
    );
    gulp.watch(paths.vendor.src,
        gulp.series(_vendorjslive, browsersyncReload)
    );

    gulp.watch(paths.ejs.src,
        gulp.series(browsersyncReload)
    );
    gulp.watch(paths.css.src2,
        gulp.series(_csslive, browsersyncReload)
    );
    gulp.watch([paths.fonts.src, paths.data.src, ...paths.img.src],
        gulp.series(statics, browsersyncReload)
    );
}

function _devserver() {
    return nodemon({
        exec: `npx ts-node --files --project ./${paths.app}/tsconfig.json ${paths.app}/${paths.serverscript}.ts`,
        ext: 'html,js,ejs,css,jsx,ts,tsx',
        watch: [paths.app],
        env: {
            NODE_ENV: "development"
        },
        execMap: {
            ts: "ts-node"
        }
    })
        .on('restart', function () {
            console.log('restarted');
        });
};

export function serverbuild() {

    if (!fs.existsSync(paths.app)) {
        return new Promise<void>((resolve) => resolve());
    }

    process.chdir(paths.app); // so directories in tsconfig make sense
    let tsProject = ts.createProject(`./tsconfig.json`);
    return tsProject.src()
        .pipe(tsProject()).js
        .pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
}

export function clean() {
    return new Promise<void>((resolve, _reject) => {
        if (fs.existsSync(paths.dist)) {
            fs.rmSync(paths.dist, { recursive: true });
        }
        if (fs.existsSync(paths.build)) {
            fs.rmSync(paths.build, { recursive: true });
        }
        if (fs.existsSync(paths.server)) {
            fs.rmSync(paths.server, { recursive: true });
        }
        resolve();
    });
}

export const frontbuild = gulp.parallel(vendorjs, js, css, statics);
export const build = gulp.series(frontbuild, serverbuild);
export const dev = gulp.series(clean, frontbuild, gulp.parallel(_watch, _devserver));
export const release = gulp.series(clean, version.increment, build);
export const incrementVersion = version.increment;

export const makeprivateflows = gulp.series(flows.makeReleaseFlow);
export const makepublicflows = gulp.series(flows.makePackageFlow);
