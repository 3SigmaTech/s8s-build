
import type { Plugin, RollupOptions, RollupWarning, OutputOptions } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import rollupReplace from '@rollup/plugin-replace';

// https://github.com/d3/d3-interpolate/issues/58
const D3_WARNING = /Circular dependency.*d3-interpolate/;

export type JSConfig = {
    isproduction: boolean,
    tsconfig: string,
    input: string,
    src: string, // Currently unused
    dest: string,
    output: string,
    externals: string[],
    globals: { [key: string]: string }
};
export const Input = (opts: JSConfig): [RollupOptions, OutputOptions] => {
    let input: RollupOptions = {
        input: opts.input,
        plugins: [
            rollupReplace({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
            (opts.tsconfig
                ? typescript({
                    tsconfig: opts.tsconfig,
                    outDir: `./${opts.dest}`
                })
                : null
            ),
            commonjs({
                include: /node_modules/
            }),
            babel({
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                presets: ["@babel/env", "@babel/preset-react"],
                targets: {
                    "browsers": "defaults and supports es6-module"
                },
                babelHelpers: 'bundled',
                exclude: 'node_modules/**'
            }),
        ],
        onwarn: function (warning: RollupWarning) {
            if (D3_WARNING.test(warning.message)) {
                return;
            }
        },
        external: opts.externals
    };

    let output:OutputOptions = {
        file: opts.output,
        format: 'umd',
        plugins: [(opts.isproduction ? terser() : null)] as Plugin[],
        name: 'main',
        globals: opts.globals
    };

    return [input, output];
};

