
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
import * as rollupConfig from './rollup.config.js';
import * as version from './version';
import * as helpers from './helpers';
import * as flows from './flows';

export function vendorjs() {

    if (!fs.existsSync(paths.vendor.src)) {
        return new Promise<void>((resolve) => resolve());
    }

    helpers.makeDirs();

    return rollup.rollup(rollupConfig.vendorInput).then((bundle) => {
        return Promise.all([
            bundle.write(rollupConfig.vendorDevOutput),
            bundle.write(rollupConfig.vendorProdOutput)
        ]);
    });
}

export function js() {
    helpers.makeDirs();

    return rollup.rollup(rollupConfig.devInput).then(bundle => {
        return Promise.all([
            bundle.write(rollupConfig.devOutput),
            bundle.write(rollupConfig.prodOutput)
        ]);
    });
}

export function visualizejs() {
    helpers.makeDirs();

    let input = rollupConfig.devInput;
    (input.plugins as rollupConfig.InputPluginOption[])
        .push(rollupConfig.visualizer);
        
    return rollup.rollup(input).then(bundle => {
        return Promise.all([
            bundle.write(rollupConfig.devOutput),
            bundle.write(rollupConfig.prodOutput)
        ]);
    });

}


export function css() {

    if (!fs.existsSync(paths.css.src[0] as string)) {
        return new Promise<void>((resolve) => resolve());
    }

    return gulp.src(paths.css.src)
        .pipe(sass({
                includePaths: ['node_modules']
            }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(paths.build + paths.css.dest))
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['node_modules']
        }))
        .pipe(gulp.dest(paths.dist + paths.css.dest));
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
        gulp.series(js, browsersyncReload)
    );
    gulp.watch(paths.vendor.src,
        gulp.series(vendorjs, browsersyncReload)
    );

    gulp.watch(paths.ejs.src,
        gulp.series(browsersyncReload)
    );
    gulp.watch(paths.css.src2,
        gulp.series(css, browsersyncReload)
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
