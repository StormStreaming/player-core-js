/* eslint-disable no-console, camelcase */

import fs from 'fs';
import obfuscator from 'javascript-obfuscator';

const umdPath = 'dist/umd/index.js';
const amdPath = 'dist/amd/index.js';
const esmPath = 'dist/esm/index.js';
const cjsPath = 'dist/cjs/index.js';
const iifePath = 'dist/iife/index.js';

const allPaths = [umdPath, amdPath, esmPath, cjsPath, iifePath];

const options = {
  compact: false,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  numbersToExpressions: true,
  simplify: true,
  stringArrayShuffle: true,
  splitStrings: true,
  stringArrayThreshold: 1
};

const obfuscate = (file) => {
  const code = fs.readFileSync(file, 'utf8');
  const obfuscationResult = obfuscator.obfuscate(code, options).toString();

  fs.writeFileSync(file, obfuscationResult, 'utf8');

};

console.log('Obfuscating files:');

for(var i=0;i<allPaths.length;i++){
  console.log('++ '+allPaths[i]);
  obfuscate(allPaths[i]);
};