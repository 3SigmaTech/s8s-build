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
    return [next, true];
  }
  return [curr, false];
};
[FRONT_SRC] = checkDown(FRONT_SRC, 'src');
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
let updated = false;
[paths.js.src, updated] = checkDown(paths.js.src, FRONT_SRC + '/index.ts');
if (updated) {
  console.log('Sending index.js to dist folder.');
  paths.js.flnm = 'index.js';
}
if (!fs.existsSync(FRONT_SRC + '/style')) {
  console.log('Sending styles to dist folder.');
  for (let i = 0; i < paths.css.src.length; i++) {
    paths.css.src[i] = paths.css.src[i].replace('/style', '');
  }
  paths.css.src2 = paths.css.src2.replace('/style', '');
  paths.css.dest = paths.css.dest.replace('/style', '');
}
let currStyles = paths.css.src[0];
let newStyle = paths.css.src[0].replace('styles', 'style');
[paths.css.src[0]] = checkDown(currStyles, newStyle);

const D3_WARNING = /Circular dependency.*d3-interpolate/;
const Input = opts => {
  let input = {
    input: opts.input,
    plugins: [rollupReplace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }), resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }), opts.tsconfig ? typescript({
      tsconfig: opts.tsconfig,
      outDir: `./${opts.dest}`
    }) : null, commonjs({
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
    external: opts.externals
  };
  let output = {
    file: opts.output,
    format: 'umd',
    plugins: [opts.isproduction ? terser() : null],
    name: 'main',
    globals: opts.globals
  };
  return [input, output];
};

let globals = {};
let externals = [];
let vendorGlobals = {};
let vendorExternals = [];
const importRegex = /^(?:\/\/\s?)?import (\* as )?(.*) from ['"](.*)['"];/gm;
const skippedImportRegex = /\/\/\s?import (\* as )?(.*) from ['"](.*)['"];/g;
if (fs.existsSync(paths.vendor.src)) {
  const vendorFile = fs.readFileSync(paths.vendor.src, 'utf-8');
  let vendorImports = vendorFile.matchAll(importRegex);
  for (const vImport of vendorImports) {
    if (!vImport[2] || !vImport[3]) {
      continue;
    }
    globals[vImport[3]] = vImport[2];
    externals.push(vImport[3]);
  }
  vendorImports = vendorFile.matchAll(skippedImportRegex);
  for (const vImport of vendorImports) {
    if (!vImport[2] || !vImport[3]) {
      continue;
    }
    vendorGlobals[vImport[3]] = vImport[2];
    vendorExternals.push(vImport[3]);
  }
} else {
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
const devInputOpts = {
  isproduction: false,
  tsconfig: publicTSconfig,
  input: paths.js.src,
  src: paths.src,
  dest: paths.build,
  output: outfileBuild,
  externals: externals,
  globals: globals
};
const [devInput, devOutput] = Input(devInputOpts);
const prodInputOpts = {
  isproduction: true,
  tsconfig: publicTSconfig,
  input: paths.js.src,
  src: paths.src,
  dest: paths.dist,
  output: outfileDist,
  externals: externals,
  globals: globals
};
const [prodInput, prodOutput] = Input(prodInputOpts);
let vendorTSconfig = '';
if (fs.existsSync(`./${paths.vendor.dir}/tsconfig.json`)) {
  vendorTSconfig = `./${paths.vendor.dir}/tsconfig.json`;
}
const vendorDevInputOpts = {
  isproduction: false,
  tsconfig: vendorTSconfig,
  input: paths.vendor.src,
  src: paths.vendor.dir,
  dest: paths.build,
  output: paths.build + paths.vendor.dest + paths.vendor.flnm,
  externals: vendorExternals,
  globals: vendorGlobals
};
const [vendorDevInput, vendorDevOutput] = Input(vendorDevInputOpts);
const vendorProdInputOpts = {
  isproduction: true,
  tsconfig: vendorTSconfig,
  input: paths.vendor.src,
  src: paths.vendor.dir,
  dest: paths.dist,
  output: paths.dist + paths.vendor.dest + paths.vendor.flnm,
  externals: vendorExternals,
  globals: vendorGlobals
};
const [vendorProdInput, vendorProdOutput] = Input(vendorProdInputOpts);

const makeDirs$1 = () => {
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
};
const isIrrelevantFile = flnm => {
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
};
const permutations = inputArr => {
  let result = [];
  const permute = function (arr) {
    let m = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };
  permute(inputArr);
  return result;
};
const powerSet = arr => {
  let set = [],
    listSize = arr.length,
    combinationsCount = 1 << listSize;
  for (let i = 1; i < combinationsCount; i++) {
    let combination = [];
    for (let j = 0; j < listSize; j++) {
      if (i & 1 << j) {
        combination.push(arr[j]);
      }
    }
    set.push(combination);
  }
  return set;
};
const allPossibleCombinations = arr => {
  let pSet = powerSet(arr);
  let combos = [];
  for (let i = 0; i < pSet.length; i++) {
    if (!pSet[i]) {
      continue;
    }
    combos = combos.concat(permutations(pSet[i]));
  }
  return combos;
};

const gittag = util.promisify(git.tag);
const gitstatus = util.promisify(git.status);
const gitpush = util.promisify(git.push);
const vRegex = /(")?version(")?:\s*"(.*?)"/g;
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
  let m1 = '',
    m2 = '';
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
    if (!fileVersion) {
      return [0, 0, 0];
    }
    console.log(`Found ${flnm} Version ${fileVersion.join('.')}`);
  }
  return [m1, m2, fileVersion];
};
const maxVersion = (vA, vB) => {
  if (vA.length != vB.length) {
    throw 'This function will only compare versions with the same specificity.';
  }
  for (let i = 0; i < vA.length; i++) {
    if (!vA[i]) {
      return [...vB];
    }
    if (!vB[i]) {
      return [...vA];
    }
    if (vA[i] > vB[i]) {
      return [...vA];
    } else if (vA[i] < vB[i]) {
      return [...vB];
    }
  }
  return [...vA];
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
const versionedFiles = [`${paths.app}/${paths.serverscript}.ts`, paths.pkg];
const increment = () => {
  let tagVersion = getTagVersion();
  let fileContext = [];
  let fileVersions = [];
  for (let i = 0; i < versionedFiles.length; i++) {
    let flnm = versionedFiles[i];
    if (!flnm) {
      throw 'We are missing a file in code? What??';
    }
    let fmeta = getFileVersion(flnm);
    fileContext.push([fmeta[0], fmeta[1]]);
    fileVersions.push(fmeta[2]);
  }
  let latest = [...tagVersion];
  for (let i = 0; i < fileVersions.length; i++) {
    let flVer = fileVersions[i];
    if (!flVer) {
      throw 'We are missing a file version.';
    }
    latest = maxVersion(latest, flVer);
  }
  if (isEqual(latest, tagVersion)) {
    latest[2] = (latest[2] ?? 0) + 1;
    console.log(`Incrementing patch release version to ${latest[2]}.`);
  }
  let latestStr = latest.join('.');
  let skipUpdates = [];
  for (let i = 0; i < fileVersions.length; i++) {
    let skip = false;
    let flVer = fileVersions[i];
    console.log(flVer);
    console.log(latest);
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
  let fileUpdates = [];
  for (let i = 0; i < fileVersions.length; i++) {
    if (skipUpdates[i]) {
      continue;
    }
    let flnm = versionedFiles[i];
    if (!flnm) {
      throw 'We are missing a file in code? How did we get here??';
    }
    console.log(`Incrementing version in ${flnm} ` + `from v${fileVersions[i]?.join('.')} to v${latestStr}`);
    let path = flnm.substring(0, flnm.lastIndexOf("/") + 1);
    let q0 = fileContext[i]?.[0],
      q1 = fileContext[i]?.[1];
    let flUpdate = gulp.src(flnm).pipe(replace(vRegex, `${q0}version${q1}: "${latestStr}"`)).pipe(gulp.dest(path));
    fileUpdates.push(flUpdate);
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
function addTag() {
  let pkgFile = fs.readFileSync('./package.json');
  let version = JSON.parse(pkgFile.toString())['version'];
  let gitChanges = versionedFiles.map(s => {
    return ` M ${s}\n`;
  });
  let allowableChanges = allPossibleCombinations(gitChanges);
  for (let i = 0; i < allowableChanges.length; i++) {
    allowableChanges[i] = allowableChanges[i].join('');
  }
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
      let files = [];
      for (let i = 0; i < versionedFiles.length; i++) {
        let flnm = versionedFiles[i];
        if (!flnm) {
          continue;
        }
        if (fs.existsSync(flnm)) {
          files.push(flnm);
        }
      }
      gulp.src(files).pipe(git.add()).pipe(git.commit('Update version')).on('end', resolve);
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
  return _vendorjsbase(false);
}
function _vendorjslive() {
  return _vendorjsbase(true);
}
function _vendorjsbase(iswatching) {
  if (isIrrelevantFile(paths.vendor.src)) {
    return new Promise(resolve => resolve());
  }
  makeDirs$1();
  let devRollup = rollup.rollup(vendorDevInput).then(bundle => bundle.write(vendorDevOutput));
  if (iswatching) {
    return devRollup;
  }
  let prodRollup = rollup.rollup(vendorProdInput).then(bundle => bundle.write(vendorProdOutput));
  return Promise.all([devRollup, prodRollup]);
}
function js() {
  return _jsbase(false);
}
function _jslive() {
  return _jsbase(true);
}
function _jsbase(iswatching) {
  makeDirs$1();
  let devRollup = rollup.rollup(devInput).then(bundle => bundle.write(devOutput));
  if (iswatching) {
    return devRollup;
  }
  let prodRollup = rollup.rollup(prodInput).then(bundle => bundle.write(prodOutput));
  return Promise.all([devRollup, prodRollup]);
}
function visualizejs() {
  makeDirs$1();
  let prodInput$1 = prodInput;
  prodInput$1.plugins.push(visualizer);
  let devRollup = rollup.rollup(devInput).then(bundle => bundle.write(devOutput));
  let prodRollup = rollup.rollup(prodInput$1).then(bundle => bundle.write(prodOutput));
  return Promise.all([devRollup, prodRollup]);
}
function css() {
  return _cssbase(false);
}
function _csslive() {
  return _cssbase(true);
}
function _cssbase(iswatching) {
  if (!fs.existsSync(paths.css.src[0])) {
    return new Promise(resolve => resolve());
  }
  let devCSS = gulp.src(paths.css.src).pipe(sass({
    includePaths: ['node_modules']
  }).on('error', sass.logError)).pipe(postcss([autoprefixer()])).pipe(gulp.dest(paths.build + paths.css.dest));
  if (iswatching) {
    return devCSS;
  }
  let prodCSS = gulp.src(paths.css.src).pipe(sass({
    outputStyle: 'compressed',
    includePaths: ['node_modules']
  }).on('error', sass.logError)).pipe(gulp.dest(paths.dist + paths.css.dest));
  return Promise.all([devCSS, prodCSS]);
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
  gulp.watch(paths.js.src2, gulp.series(_jslive, browsersyncReload));
  gulp.watch(paths.vendor.src, gulp.series(_vendorjslive, browsersyncReload));
  gulp.watch(paths.ejs.src, gulp.series(browsersyncReload));
  gulp.watch(paths.css.src2, gulp.series(_csslive, browsersyncReload));
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
  if (!fs.existsSync(paths.app)) {
    return new Promise(resolve => resolve());
  }
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
const incrementVersion = increment;
const makeprivateflows = gulp.series(makeReleaseFlow);
const makepublicflows = gulp.series(makePackageFlow);

export { build, clean, css, dev, frontbuild, incrementVersion, js, makeprivateflows, makepublicflows, release, serverbuild, statics, vendorjs, visualizejs };
