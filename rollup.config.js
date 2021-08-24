import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
// import pegjs from "./lib/rollup-plugin-pegjs";
import {terser} from "rollup-plugin-terser";
import visualizer from 'rollup-plugin-visualizer';
// import ignoreInfiniteLoop from './lib/peggy-no-infinite-loop.js';


import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

const prod = process.env.NODE_ENV === "production"

export default [{
    input: "src/index.ts",
    plugins: [
        // resolve before pegjs so that the filter in pegjs has less left to do
        resolve({
            extensions: [".js", ".ts"],
            preferBuiltins: true
        }),
        // TODO FIXME dynamic import for packages and plugins
        dynamicImportVars({
            include: "*.ts"
        }),
        // pegjs({
        //     plugins: [ignoreInfiniteLoop],
        //     target: "commonjs",
        //     exportVar: "parser",
        //     format: "bare",
        //     trace: false
        // }),
        commonjs(),
        typescript({
            module: "esnext",
            lib: ["es5", "es6", "dom"],
            target: "es5",
            moduleResolution: "node",
            importHelpers: true,
            esModuleInterop: true,
            experimentalDecorators: true,
            sourceMap: true
        }),
        visualizer({
            filename: 'dist/latex.stats.html',
            sourcemap: prod,
            // template: 'network'
        })
    ],
    output: [{
        file: "dist/latex.mjs",
        format: "es",
        sourcemap: true,
        plugins: [...(prod ? [terser()] : [])]
    }, {
        file: "dist/latex.js",
        format: "umd",
        name: "latexjs",
        sourcemap: true,
        plugins: [
            {
                name: 'import-meta-to-umd',
                resolveImportMeta(property) {
                    if (property === 'url') {
                      return `document.currentScript && document.currentScript.src`;
                    }
                    return null;
                }
            },
            ...(prod ? [terser()] : [])
        ]
    }]
}]
