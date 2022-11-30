import fs from 'fs-extra';
import path from 'path';

const outputFolder = './out';

export function clearSync() {
  fs.removeSync(outputFolder);
}

export function setupFolders() {
  fs.ensureDirSync(outputFolder);
}

export function ensurePath(relativePath: string) {
  isAbsolute(relativePath);
  const folder = path.join(outputFolder, relativePath);
  fs.ensureDirSync(folder);
}

export async function saveJsonToFile(data: unknown, relativePath: string) {
  isAbsolute(relativePath);
  const saveFile = path.join(outputFolder, relativePath);
  fs.writeFile(saveFile, JSON.stringify(data, undefined, 2));
}

function isAbsolute(testPath: string) {
  if (path.isAbsolute(testPath)) throw new Error(`Expected relative path. Found: ${testPath}`);
}
