import fs from 'fs';

const umdPath = 'dist/umd/index.js';
const amdPath = 'dist/amd/index.js';
const esmPath = 'dist/esm/index.js';
const cjsPath = 'dist/cjs/index.js';
const iifePath = 'dist/iife/index.js';

const allPaths = [umdPath, amdPath, esmPath, cjsPath, iifePath];

const banner = (file) => {
  const packageJSONRaw = fs.readFileSync('./package.json', 'utf8');
  const packageJSON = JSON.parse(packageJSONRaw);

  const banner = fs.readFileSync('./assets/license-header.txt', 'utf8');
  const code = fs.readFileSync(file, 'utf8');
  let output = banner + code;

  output = replaceAll(output, "$version", packageJSON.version);
  output = replaceAll(output,"$compileDate",new Date().toLocaleString());

  fs.writeFileSync(file, output, 'utf8');
};

const replaceAll = (str, find, replace) => {
  return str.split(find).join(replace);
}

console.log('Add banner to files:');

for(var i=0;i<allPaths.length;i++){
  console.log('++ '+allPaths[i]);
  banner(allPaths[i]);
};