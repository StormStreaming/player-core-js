// rollup.config.js
import babel from '@rollup/plugin-babel'
import resolve from "@rollup/plugin-node-resolve";
import typescript from 'rollup-plugin-typescript2';
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";
import terser from "@rollup/plugin-terser";

const NODE_ENV_PRODUCTION = "production";
const nodeEnv = process.env.NODE_ENV || NODE_ENV_PRODUCTION;
const SOURCE_MAPS = false;

console.log(`
-------------------------------------
Rollup building bundle for ${process.env.BABEL_ENV}
-------------------------------------
`)
const extensions = ['.js', '.ts'];

export default {
    input: [
        ...(process.env.BABEL_ENV === 'iifeBundled'
            ? [
                'src/index.iife.ts'
            ]
            : []),
        ...(process.env.BABEL_ENV === 'umdBundled'
            ? [
                'src/index.umd.ts'
            ]
            : []),
        ...(process.env.BABEL_ENV === 'esmBundled'
            ? [
                'src/index.esm.ts'
            ]
            : []),
        ...(process.env.BABEL_ENV === 'amdBundled'
            ? [
                'src/index.amd.ts'
            ]
            : []),
        ...(process.env.BABEL_ENV === 'cjsBundled'
            ? [
                'src/index.cjs.ts'
            ]
            : []),
    ],
    output: [
        ...(process.env.BABEL_ENV === 'esmBundled'
            ? [
                {
                    file: 'dist/esm/index.js',
                    sourcemap:SOURCE_MAPS,
                    format: 'esm',
                },
            ]
            : []),
        ...(process.env.BABEL_ENV === 'umdBundled'
            ? [
                {
                    file: 'dist/umd/index.js',
                    sourcemap:SOURCE_MAPS,
                    format: 'umd',
                    name: 'stormPlayerCore',
                },
            ]
            : []),
        ...(process.env.BABEL_ENV === 'cjsBundled'
            ? [
                {
                    file: 'dist/cjs/index.js',
                    sourcemap:SOURCE_MAPS,
                    format: 'cjs',
                    name: 'stormPlayerCore',
                },
            ]
            : []),
        ...(process.env.BABEL_ENV === 'iifeBundled'
            ? [
                {
                    file: 'dist/iife/index.js',
                    sourcemap:SOURCE_MAPS,
                    format: 'iife',
                    name: 'stormPlayerCore'
                },
            ]
            : []),
        ...(process.env.BABEL_ENV === 'amdBundled'
            ? [
                {
                    file: 'dist/amd/index.js',
                    sourcemap:SOURCE_MAPS,
                    format: 'amd',
                    name: 'stormCorePlayer',
                },
            ]
            : []),
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            tsconfigOverride: {compilerOptions: {declaration: false}}
        }),
        commonjs(),
        resolve({
            browser: true,
            extensions,
        }),
        babel({
            babelHelpers: 'bundled',
            include: ['src/**/*.ts'],
            extensions,
            exclude: './node_modules/**',
        }),
        nodeEnv !== "production" &&
        serve({
            open: true,
            verbose: true,
            contentBase: ["", "tests"],
            host: "127.0.0.1",
            port: 8087,
        }),
        nodeEnv !== "production" && livereload(),
    ],
    watch: {
        chokidar: {
            usePolling: true
        },
        buildDelay: 500
    }
}