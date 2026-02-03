/* eslint-disable no-console, camelcase */

import fs from 'fs';
import uglify from 'uglify-js';

const umdPath = 'dist/umd/index.js';
const amdPath = 'dist/amd/index.js';
const esmPath = 'dist/esm/index.js';
const cjsPath = 'dist/cjs/index.js';
const iifePath = 'dist/iife/index.js';

const allPaths = [umdPath, esmPath, cjsPath, iifePath];

const options = {
  nameCache: {},
  output: {
    comments: false
  },
  mangle: true,
  compress: {
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: false,
    typeofs: false
  }
};

const minify = (file) => {
  const code = fs.readFileSync(file, 'utf8');
  const minified = uglify.minify(code, options);

  if (minified.error) {
    console.error(minified.error);
    return;
  }

  if (minified.warnings) {
    console.warn(minified.warnings);
  }

  fs.writeFileSync(file, minified.code, 'utf8');

};

console.log('Minifying files:');

for(var i=0;i<allPaths.length;i++){
  console.log('++ '+allPaths[i]);
  minify(allPaths[i]);
};

