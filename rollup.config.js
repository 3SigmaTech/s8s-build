import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

// Mark all dependencies as external
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const external = Object.keys(pkg.dependencies || {});

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