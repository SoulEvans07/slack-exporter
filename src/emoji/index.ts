import fs from 'fs';
import path from 'path';
// import chalk from 'chalk';
import { customEmojis } from './custom-emojis';
import { emojiUrls } from './emoji-urls';
import { config } from '../const/config';
import { fileDownload } from '../services/download';

async function main() {
  const custom = Object.entries(customEmojis)
    .filter(([name, url]) => url.startsWith('http'))
    .map(([name, url]) => {
      const lastDot = url.lastIndexOf('.');
      return [name + url.slice(lastDot), url];
    });
  const normal = emojiUrls.map(url => [
    url.replace('https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-medium/', '').replace('@2x', ''),
    url,
  ]);

  const folderPath = path.join(config.output, 'emojis');
  for (const [name, url] of [...normal, ...custom]) {
    try {
      const filePath = path.join(folderPath, name);
      await fs.promises.stat(filePath);
      // console.log(chalk.green('[found]'), name);
      console.log('[found]', name);
    } catch (_e) {
      try {
        await fileDownload(url, folderPath, name);
        // console.log(chalk.blue('[downloaded]'), name);
        console.log('[downloaded]', name);
      } catch (e) {
        // console.log(chalk.blue('[failed]'), name);
        console.log('[failed]', name);
        return;
      }
    }
  }
}

main();
