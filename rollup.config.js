import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

// Mark all dependencies as external
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const external = Object.keys(pkg.dependencies || []);

// TODO: Consider the below (or consider adding vendor.ts support)
// // Add back some dependencies to reduce number of required packages down stream
// const includeThese = ['gulp-git', 'gulp-nodemon', 'gulp-postcss', 'gulp-replace', 'gulp-sass', 'gulp-typescript'];
// for (let i = 0; i < includeThese.length; i++) {
//     const index = external.indexOf(includeThese[i]);
//     if (index > -1) {
//         external.splice(index, 1);
//     }
// }

let base = {
    input: './src/index.ts',
    output: {
        format: 'umd',
        name: 'index'
    },
    plugins: [
        resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
        commonjs({
            include: /node_modules/
        }),
        json(),
        babel({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            presets: ["@babel/env", "@babel/preset-react"],
            targets: {
                "browsers": "defaults and supports es6-module"
            },
            babelHelpers: 'bundled'
        }),
    ],
    external
};

let build = Object.assign({ ...base }, {
    output: { file: './dist/index.js' },
    plugins: [...base.plugins, typescript({
        tsconfig: `./tsconfig.json`,
    })]
});

export default [build];