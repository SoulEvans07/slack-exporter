import Downloader from 'nodejs-file-downloader';
import { config } from '../../const/config';

export async function fileDownload(fileUrl: string, outputFolder: string, fileName: string) {
  const downloader = new Downloader({
    url: fileUrl,
    fileName,
    directory: outputFolder,
    cloneFiles: false,
    headers: {
      Authorization: `Bearer ${config.slack.oauthToken}`,
    },
    // onProgress: function (percentage, chunk, remainingSize) {
    //   //Gets called with each chunk.
    //   console.log('% ', percentage);
    //   console.log('Current chunk of data: ', chunk);
    //   console.log('Remaining bytes: ', remainingSize);
    // },
  });

  return await downloader.download();
}
