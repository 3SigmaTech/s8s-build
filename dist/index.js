import gulp from 'gulp';
import nodemon from 'gulp-nodemon';
import fs from 'fs';
import bs from 'browser-sync';
import gulpSass from 'gulp-sass';
import nodeSass from 'node-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import ts from 'gulp-typescript';
import * as rollup from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import rollupReplace from '@rollup/plugin-replace';
import { visualizer } from 'rollup-plugin-visualizer';
import util from 'util';
import replace from 'gulp-replace';
import git from 'gulp-git';
import path from 'path';
import { fileURLToPath } from 'url';

let VENDOR_SRC = 'vendor';
let FRONT_SRC = 'public';
let FRONT_DIST = 'dist';
let FRONT_BUILD = 'build';
let BACK_SRC = 'app';
let BACK_DIST = 'server';
const checkDown = (curr, next) => {
  if (!fs.existsSync('./' + curr)) {
    console.log(`Changing configured directory from ${curr} to ${next}.`);
    return next;
  }
  return curr;
};
FRONT_SRC = checkDown(FRONT_SRC, 'src');
const paths = {
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
    src2: [VENDOR_SRC + '/**/*.js', VENDOR_SRC + '/**/*.ts', VENDOR_SRC + '/**/*.jsx', VENDOR_SRC + '/**/*.tsx'],
    dest: '/js',
    flnm: '/vendor.js'
  },
  js: {
    src: FRONT_SRC + '/js/index.ts',
    src2: [FRONT_SRC + '/js/**/*.js', FRONT_SRC + '/js/**/*.ts', FRONT_SRC + '/jsx/**/*.jsx', FRONT_SRC + '/jsx/**/*.tsx'],
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
};
paths.js.src = checkDown(paths.js.src, FRONT_SRC + '/index.ts');

const D3_WARNING = /Circular dependency.*d3-interpolate/;
if (fs.existsSync(paths.vendor.src)) {
  const vendorFile = fs.readFileSync(paths.vendor.src, 'utf-8');
  console.log(vendorFile);
}
let publicTSPlugin = null;
if (fs.existsSync(`./${paths.src}/tsconfig.json`)) {
  publicTSPlugin = typescript({
    tsconfig: `./${paths.src}/tsconfig.json`
  });
}
const devInput = {
  input: paths.js.src,
  plugins: [rollupReplace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }), resolve({
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }), publicTSPlugin, commonjs({
    include: /node_modules/
  }), babel({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    presets: ["@babel/env", "@babel/preset-react"],
    targets: {
      "browsers": "defaults and supports es6-module"
    },
    babelHelpers: 'bundled',
    exclude: 'node_modules/**'
  })],
  onwarn: function (warning) {
    if (D3_WARNING.test(warning.message)) {
      return;
    }
  },
  external: ['react', 'react-dom', 'd3', 'topojson-client', 'bootstrap', "react-bootstrap", "react-dnd", "react-dnd-html5-backend", "react-dnd-touch-backend", "@fullcalendar/core", "@fullcalendar/react", "@fullcalendar/daygrid", "@fullcalendar/timegrid", "@fullcalendar/interaction", "@fullcalendar/multimonth", "s8s-gtable"]
};
const devOutput = {
  file: paths.build + paths.js.dest + paths.js.flnm,
  format: 'umd',
  plugins: [],
  name: 'main',
  globals: {
    "react": 'React',
    "react-dom": 'ReactDOM',
    "d3": 'd3',
    "topojson-client": 'topojson',
    "bootstrap": 'bootstrap',
    "react-bootstrap": "ReactBootstrap",
    "react-dnd": "ReactDND",
    "react-dnd-html5-backend": "ReactDNDHTML5Backend",
    "react-dnd-touch-backend": "ReactDNDTouchBackend",
    "@fullcalendar/core": "FullCalendarCore",
    "@fullcalendar/react": "FullCalendar",
    "@fullcalendar/daygrid": "fcDayGridPlugin",
    "@fullcalendar/timegrid": "fcTimeGridPlugin",
    "@fullcalendar/interaction": "fcInteractionPlugin",
    "@fullcalendar/multimonth": "fcMultimonthPlugin",
    "s8s-gtable": "s8sGtable"
  }
};
const prodOutput = {
  ...devOutput
};
prodOutput.file = paths.dist + paths.js.dest + paths.js.flnm;
prodOutput.plugins = [terser()];
let vendorTSPlugin = null;
if (fs.existsSync(`./${paths.vendor.dir}/tsconfig.json`)) {
  vendorTSPlugin = typescript({
    tsconfig: `./${paths.vendor.dir}/tsconfig.json`
  });
}
const vendorInput = {
  input: paths.vendor.src,
  plugins: [rollupReplace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }), resolve({
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }), vendorTSPlugin, commonjs({
    include: /node_modules/
  }), babel({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    presets: ["@babel/env", "@babel/preset-react"],
    targets: {
      "browsers": "defaults and supports es6-module"
    },
    babelHelpers: 'bundled'
  })],
  onwarn: function (warning) {
    if (D3_WARNING.test(warning.message)) {
      return;
    }
  },
  external: ['react', 'react-dom', 'd3', 'topojson-client', 'bootstrap', 'react-bootstrap']
};
const vendorDevOutput = {
  file: paths.build + paths.vendor.dest + paths.vendor.flnm,
  format: 'umd',
  plugins: [],
  name: 'vendor',
  globals: {
    "react": 'React',
    "react-dom": 'ReactDOM',
    "d3": 'd3',
    "topojson-client": 'topojson',
    "bootstrap": 'bootstrap',
    "react-bootstrap": "react-bootstrap"
  }
};
const vendorProdOutput = {
  ...vendorDevOutput
};
vendorProdOutput.file = paths.dist + paths.vendor.dest + paths.vendor.flnm;
vendorProdOutput.plugins = [terser()];

const gittag = util.promisify(git.tag);
const gitstatus = util.promisify(git.status);
const gitpush = util.promisify(git.push);
const vRegex = /"?version"?:\s*"(.*?)"/g;
const tagToArr = tag => {
  let iArr = [0, 0, 0];
  if (!tag) {
    return iArr;
  }
  let sArr = tag.replace('v', '').split('.');
  iArr[0] = parseInt(sArr[0] ?? '0');
  iArr[1] = parseInt(sArr[1] ?? '0');
  iArr[2] = parseInt(sArr[2] ?? '0');
  return iArr;
};
const getTagVersion = () => {
  let tags = fs.readdirSync('./.git/refs/tags');
  tags.sort(function (a, b) {
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
};
const getFileVersion = flnm => {
  let fileVersion = [0, 0, 0];
  if (fs.existsSync(flnm)) {
    let appFile = fs.readFileSync(flnm, 'utf8');
    let appV = appFile.matchAll(vRegex);
    fileVersion = [0, 0, 0];
    for (const match of appV) {
      fileVersion = tagToArr(match[1]);
      break;
    }
    if (!fileVersion) {
      return [0, 0, 0];
    }
    console.log(`Found ${flnm} Version ${fileVersion.join('.')}`);
  }
  return fileVersion;
};
const maxVersion = (vA, vB) => {
  if (vA.length != vB.length) {
    throw 'This function will only compare versions with the same specificity.';
  }
  for (let i = 0; i < vA.length; i++) {
    if (!vA[i]) {
      return vB;
    }
    if (!vB[i]) {
      return vA;
    }
    if (vA[i] > vB[i]) {
      return vA;
    } else if (vA[i] < vB[i]) {
      return vB;
    }
  }
  return vA;
};
const isEqual = (vA, vB) => {
  if (vA.length != vB.length) {
    throw 'This function will only compare versions with the same specificity.';
  }
  for (let i = 0; i < vA.length; i++) {
    if (vA[i] != vB[i]) {
      return false;
    }
  }
  return true;
};
const isZero = vA => {
  for (let i = 0; i < vA.length; i++) {
    if (vA[i] != 0) {
      return false;
    }
  }
  return true;
};
const increment = () => {
  let tagVersion = getTagVersion();
  let appVersion = getFileVersion(`${paths.app}/${paths.serverscript}.ts`);
  let pkgVersion = getFileVersion(paths.pkg);
  let latest = maxVersion(tagVersion, appVersion);
  latest = maxVersion(latest, pkgVersion);
  let skipApp, skipPkg;
  if (isEqual(latest, tagVersion)) {
    latest[2] = (latest[2] ?? 0) + 1;
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
    app = gulp.src('./app/app.ts').pipe(replace(vRegex, `version: "${latestStr}"`)).pipe(gulp.dest('./app/'));
  }
  if (!skipPkg) {
    console.log(`Incrementing version in package.json from v${pkgVersion?.join('.')} to v${latestStr}`);
    let gaeVregex = /--version v[\d\-]* /g;
    pkg = gulp.src('./package.json').pipe(replace(vRegex, `"version": "${latestStr}"`)).pipe(replace(gaeVregex, `--version v${latest.join('-')} `)).pipe(gulp.dest('./'));
  }
  let fileUpdates = [];
  if (app && pkg) {
    fileUpdates = [app, pkg];
  } else if (app) {
    fileUpdates = [app];
  } else if (pkg) {
    fileUpdates = [pkg];
  }
  if (fileUpdates.length > 0) {
    return Promise.all(fileUpdates).then(() => {
      return setTimeout(() => {
        addTag();
      }, 3000);
    });
  }
  throw new Error('Function incrementVersion failed to define increment task.');
};
const allowableChanges = [' M app/app.ts\n M package.json\n', ' M app/app.ts\n', ' M package.json\n'];
function addTag() {
  let pkgFile = fs.readFileSync('./package.json');
  let version = JSON.parse(pkgFile.toString())['version'];
  return gitstatus({
    args: '--porcelain'
  }).then(changes => {
    if (!allowableChanges.includes(changes)) {
      console.log(' -- Detected changes -- ');
      console.log(changes);
      console.log(' --  -- ');
      throw new Error('Task addTag can only be run on a clean repository. ' + 'Run "git status --porcelain" to see what blocked the task.');
    }
    return new Promise(function (resolve, _reject) {
      gulp.src(['./app/app.ts', './package.json']).pipe(git.add()).pipe(git.commit('Update version')).on('end', resolve);
    });
  }).then(() => {
    return gittag('v' + version, "New version");
  }).then(() => {
    return gitpush('origin', 'main');
  }).then(() => {
    return gitpush('origin', 'main', {
      args: " --tags"
    });
  }).catch(err => {
    if (err) {
      console.log(err);
      throw err;
    }
  });
}

function makeDirs$1() {
  if (!fs.existsSync(paths.build + paths.vendor.dest)) {
    fs.mkdirSync(paths.build + paths.vendor.dest, {
      recursive: true
    });
  }
  if (!fs.existsSync(paths.build + paths.js.dest)) {
    fs.mkdirSync(paths.build + paths.js.dest, {
      recursive: true
    });
  }
  if (!fs.existsSync(paths.dist + paths.js.dest)) {
    fs.mkdirSync(paths.dist + paths.js.dest, {
      recursive: true
    });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function makeDirs() {
  if (!fs.existsSync('./.github/workflows')) {
    fs.mkdirSync('./.github/workflows', {
      recursive: true
    });
  }
}
const makeReleaseFlow = () => {
  console.log('Creating flow to create release from new tag.');
  makeDirs();
  return gulp.src(__dirname + '/bin/create_release.yml').pipe(gulp.dest('./.github/workflows'));
};
const makePackageFlow = () => {
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
    devpacktask = gulp.src(__dirname + '/bin/devpack.sh').pipe(gulp.dest('./bin'));
  }
  return Promise.all([gulp.src(__dirname + '/bin/release_package.yml').pipe(gulp.dest('./.github/workflows')), gulp.src(__dirname + '/bin/scope_package.js').pipe(replace(packageRegex, packageName)).pipe(gulp.dest('./.github/workflows')), devpacktask]);
};

const browserSync = bs.create();
const sass = gulpSass(nodeSass);
function vendorjs() {
  if (!fs.existsSync(paths.vendor.src)) {
    return new Promise(resolve => resolve());
  }
  makeDirs$1();
  return rollup.rollup(vendorInput).then(bundle => {
    return Promise.all([bundle.write(vendorDevOutput), bundle.write(vendorProdOutput)]);
  });
}
function js() {
  makeDirs$1();
  return rollup.rollup(devInput).then(bundle => {
    return Promise.all([bundle.write(devOutput), bundle.write(prodOutput)]);
  });
}
function visualizejs() {
  makeDirs$1();
  let input = devInput;
  input.plugins.push(visualizer);
  return rollup.rollup(input).then(bundle => {
    return Promise.all([bundle.write(devOutput), bundle.write(prodOutput)]);
  });
}
function css() {
  return gulp.src(paths.css.src).pipe(sass({
    includePaths: ['node_modules']
  }).on('error', sass.logError)).pipe(postcss([autoprefixer()])).pipe(gulp.dest(paths.build + paths.css.dest)).pipe(sass({
    outputStyle: 'compressed',
    includePaths: ['node_modules']
  })).pipe(gulp.dest(paths.dist + paths.css.dest));
}
function statics() {
  return Promise.all([gulp.src(paths.img.src).pipe(gulp.dest(paths.build + paths.img.dest)).pipe(gulp.dest(paths.dist + paths.img.dest)), gulp.src(paths.fonts.src).pipe(gulp.dest(paths.build + paths.fonts.dest)).pipe(gulp.dest(paths.dist + paths.fonts.dest)), gulp.src(paths.data.src).pipe(gulp.dest(paths.build + paths.data.dest)).pipe(gulp.dest(paths.dist + paths.data.dest))]);
}
function browsersyncReload(cb) {
  browserSync.reload();
  if (cb) {
    cb();
  }
}
function _watch() {
  browserSync.init({
    open: false,
    proxy: "http://localhost:4987/",
    port: 3000
  });
  gulp.watch(paths.js.src2, gulp.series(js, browsersyncReload));
  gulp.watch(paths.vendor.src, gulp.series(vendorjs, browsersyncReload));
  gulp.watch(paths.ejs.src, gulp.series(browsersyncReload));
  gulp.watch(paths.css.src2, gulp.series(css, browsersyncReload));
  gulp.watch([paths.fonts.src, paths.data.src, ...paths.img.src], gulp.series(statics, browsersyncReload));
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
  }).on('restart', function () {
    console.log('restarted');
  });
}
function serverbuild() {
  process.chdir(paths.app);
  let tsProject = ts.createProject(`./tsconfig.json`);
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
}
function clean() {
  return new Promise((resolve, _reject) => {
    if (fs.existsSync(paths.dist)) {
      fs.rmSync(paths.dist, {
        recursive: true
      });
    }
    if (fs.existsSync(paths.build)) {
      fs.rmSync(paths.build, {
        recursive: true
      });
    }
    if (fs.existsSync(paths.server)) {
      fs.rmSync(paths.server, {
        recursive: true
      });
    }
    resolve();
  });
}
const frontbuild = gulp.parallel(vendorjs, js, css, statics);
const build = gulp.series(frontbuild, serverbuild);
const dev = gulp.series(clean, frontbuild, gulp.parallel(_watch, _devserver));
const release = gulp.series(clean, increment, build);
const makeprivateflows = gulp.series(makeReleaseFlow);
const makepublicflows = gulp.series(makePackageFlow);

export { build, clean, css, dev, frontbuild, js, makeprivateflows, makepublicflows, release, serverbuild, statics, vendorjs, visualizejs };
