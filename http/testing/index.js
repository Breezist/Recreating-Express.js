/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file index.js
 * @author Breezist
 * @since June 5th, 2026
 * @description Dynamically loads and runs all unit testers and outputs them to ./output.log! 
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.writeFileSync(path.join(__dirname, `./output.log`), ``);

const logStream = fs.createWriteStream(path.join(__dirname, `./output.log`), { flags: `a` });
function hookStream(stream, name) {
  const original = stream.write;
  stream.write = function(chunk, encoding, callback) {
    const text = chunk.toString();
    const clean = stripAnsi(text);

    logStream.write(`[${name}] ${clean}`);
    return original.apply(stream, arguments);
  };
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, ``);
}

hookStream(process.stdout, `stdout`);
hookStream(process.stderr, `stderr`);

const testDir = path.join(__dirname, `tests`);
for (const file of fs.readdirSync(testDir)) {
  if (!file.endsWith(`.js`)) continue;
  const fullPath = path.join(testDir, file);
  const fileUrl = pathToFileURL(fullPath);

  await import(fileUrl);
}