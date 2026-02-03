/* eslint-disable no-console, camelcase */

import fs from 'fs-extra';

async function cleanDirectories(dirs) {
  for (const dir of dirs) {
    try {
      await fs.emptyDir(dir);
    } catch (err) {
      console.error(`Błąd podczas czyszczenia katalogu: ${dir}. Szczegóły błędu: ${err}`);
    }
  }
}

const directoriesToClean = ['./build', './dist'];

cleanDirectories(directoriesToClean);