
import fs from 'fs';

import type { Plugin, RollupOptions, RollupWarning, OutputOptions } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import rollupReplace from '@rollup/plugin-replace'; 

import { paths } from './paths';

export { visualizer } from 'rollup-plugin-visualizer';
export type { InputPluginOption } from 'rollup';

// https://github.com/d3/d3-interpolate/issues/58
const D3_WARNING = /Circular dependency.*d3-interpolate/;

// Mark all packages included in vendor.ts as external
if (fs.existsSync(paths.vendor.src)) {
    const vendorFile = fs.readFileSync(paths.vendor.src, 'utf-8');
    console.log(vendorFile);
    //const external = Object.keys(pkg.dependencies || {});
    // create external and globals
}

let publicTSPlugin = null;
if (fs.existsSync(`./${paths.src}/tsconfig.json`)) {
    publicTSPlugin = typescript({
        tsconfig: `./${paths.src}/tsconfig.json`,
    });
} else if (fs.existsSync(`./tsconfig.json`)) {
    publicTSPlugin = typescript({
        tsconfig: `./tsconfig.json`,
    });
}
export const devInput:RollupOptions = {
    input: paths.js.src,
    plugins: [
        rollupReplace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
        publicTSPlugin,
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
    external: [
        'react', 'react-dom', 'd3', 'topojson-client', 'bootstrap',
        "react-bootstrap",
        "react-dnd",
        "react-dnd-html5-backend",
        "react-dnd-touch-backend",
        "@fullcalendar/core",
        "@fullcalendar/react",
        "@fullcalendar/daygrid",
        "@fullcalendar/timegrid",
        "@fullcalendar/interaction",
        "@fullcalendar/multimonth",
        "s8s-gtable"

        // /node_modules/
    ]
};

let outfileBuild = paths.build + paths.js.dest + paths.js.flnm;
let outfileDist = paths.dist + paths.js.dest + paths.js.flnm;
if (paths.js.flnm.indexOf('/') == -1) {
    outfileBuild = paths.build + '/' + paths.js.flnm;
    outfileDist = paths.dist + '/' + paths.js.flnm;
}
export const devOutput:OutputOptions = {
    file: outfileBuild,
    //dir: FRONT_BUILD + paths.js.dest,
    format: 'umd',
    //format: 'esm', // needed if I want code splitting
    //preserveModules: true, 
    //preserveModulesRoot: 'public',
    plugins: [] as Plugin[],
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
        "s8s-gtable": "s8sGtable",

    },
};

export const prodOutput:OutputOptions = {...devOutput};
prodOutput.file = outfileDist;
prodOutput.plugins = [terser()];



let vendorTSPlugin = null;
if (fs.existsSync(`./${paths.vendor.dir}/tsconfig.json`)) {
    vendorTSPlugin = typescript({
        tsconfig: `./${paths.vendor.dir}/tsconfig.json`,
        // declaration: true,
        // declarationDir: 'dist',
    });
} 
export const vendorInput:RollupOptions = {
    input: paths.vendor.src,
    plugins: [
        rollupReplace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
        vendorTSPlugin,
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
        }),
    ],
    onwarn: function (warning: RollupWarning) {
        if (D3_WARNING.test(warning.message)) {
            return;
        }
    },
    external: [
        'react', 'react-dom', 'd3', 'topojson-client', 'bootstrap', 'react-bootstrap'
    ]
};

export const vendorDevOutput: OutputOptions = {
    file: paths.build + paths.vendor.dest + paths.vendor.flnm,
    //dir: paths.build + paths.vendor.dest,
    format: 'umd',
    //format: 'esm', // needed if I want code splitting
    //preserveModules: true,
    //preserveModulesRoot: 'public',
    plugins: [] as Plugin[],
    name: 'vendor',
    globals: {
        "react": 'React',
        "react-dom": 'ReactDOM',
        "d3": 'd3',
        "topojson-client": 'topojson',
        "bootstrap": 'bootstrap',
        "react-bootstrap": "react-bootstrap",
    },
    // manualChunks: (id) => {
    //     if (id.includes("node_modules")) {
    //         if (id.includes("@fullcalendar")) {
    //             return "vendor_fullcalendar";
    //         } else if (id.includes("react") || id.includes("dnd-")) {
    //             return "vendor_react";
    //         } else if (id.includes("d3") || id.includes("topojson")) {
    //             return "vendor_d3";
    //         } else if (id.includes("bootstrap")) {
    //             return "vendor_bootstrap";
    //         } else if (id.includes("popper")) {
    //             return "vendor_popper";
    //         }
    //         return "vendor"; // all other package goes here
    //     }
    // },
};

export const vendorProdOutput = {...vendorDevOutput};
vendorProdOutput.file = paths.dist + paths.vendor.dest + paths.vendor.flnm;
vendorProdOutput.plugins = [terser()];