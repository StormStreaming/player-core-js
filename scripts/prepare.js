/* eslint-disable no-console, camelcase */

import fs from 'fs';

const umdPath = 'dist/umd/index.js';
const amdPath = 'dist/amd/index.js';
const esmPath = 'dist/esm/index.js';
const cjsPath = 'dist/cjs/index.js';
const iifePath = 'dist/iife/index.js';

const allPaths = [umdPath, amdPath, esmPath, cjsPath, iifePath];

const prepare = (file) => {

  const packageJSONRaw = fs.readFileSync('./package.json', 'utf8');
  const packageJSON = JSON.parse(packageJSONRaw);

  let output = fs.readFileSync(file, 'utf8');

  output = replaceAll(output, "$version", packageJSON.version);
  output = replaceAll(output,"$compileDate",new Date().toLocaleString());

  fs.writeFileSync(file, output, 'utf8');

};

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

console.log('Preparing files:');

for(var i=0;i<allPaths.length;i++){
  console.log('++ '+allPaths[i]);
  prepare(allPaths[i]);
};
