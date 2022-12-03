import path from 'path';
import { File } from '@slack/web-api/dist/response/FilesListResponse';

import './polyfills';
import { config } from './const/config';
import { ensurePath, saveJsonToFile, setupFolders } from './services/files';
import {
  fetchHistory,
  findUserByEmail,
  findConversationWithUser,
  listConversations,
  listUsers,
  buildUserMap,
  listFiles,
  getChatOutputFolder,
  buildChatMap,
} from './services/slack';
import { fileDownload } from './services/download';

main();

async function main() {
  // clearSync();
  setupFolders();

  console.log('[users] fetch...');
  const userList = await listUsers();
  const users = buildUserMap(userList);
  saveJsonToFile(users, 'users.json');
  console.log(`[users] found ${userList.length}`);

  console.log('get converstaions...');
  const chatList = await listConversations();
  const chats = buildChatMap(chatList);
  saveJsonToFile(chatList, 'conversations.json');

  console.log(`exporting ${chatList.length} conversations`);
  for (const chat of chatList) {
    if (chat.id == undefined) {
      console.error(`chat missing id`, chat);
      continue;
    }

    const { folder, visibility, type, name } = getChatOutputFolder(chat, users);

    console.log(`[${chat.id}] ${name} - ${visibility}/${type}`);
    ensurePath(folder);
    saveJsonToFile(chat, path.join(folder, 'meta.json'));

    console.log(`[${chat.id}] exporting...`);
    const history = await fetchHistory(chat.id);
    console.log(`[${chat.id}] saving...`);
    saveJsonToFile(history, path.join(folder, 'history.json'));
    console.log(`[${chat.id}] done!\n`);
  }

  console.log('get files...');
  const files = await listFiles();
  saveJsonToFile(files, './all-files.json');

  const filesMap = files.reduce((acc, file) => {
    const convIds = [...(file.channels || []), ...(file.groups || []), ...(file.ims || [])];
    if (convIds.length === 0) convIds.push('__UNLINKED__');
    convIds.forEach(id => {
      if (acc[id] === undefined) acc[id] = [file];
      else acc[id].push(file);
    });
    return acc;
  }, {} as Record<string, Array<File>>);
  saveJsonToFile(filesMap, './files-map.json');

  console.log('download files...');
  for (const [convId, files] of Object.entries(filesMap)) {
    // if (convId !== 'C0491D6B4U8') continue;
    const chat = chats[convId];

    let folder = './';
    if (chat) folder = getChatOutputFolder(chat, users).folder;

    const filesFolder = path.join(folder, 'files');
    ensurePath(filesFolder);

    for (const file of files) {
      const url = file.url_private_download || file.url_private;

      if (!url) {
        console.error(folder, url);
        continue;
      }

      const fileName = file.name || file.id!;
      console.log(`[files][${convId}] download ${fileName} ...`);

      const folderPath = path.join(config.output, filesFolder);
      await fileDownload(url, folderPath, fileName);
      console.log(`[files][${convId}] ${fileName} saved to ${folder}`);
    }
  }

  console.log('Done!');
}

async function savePrivate() {
  const user = await findUserByEmail(config.slack.userEmail);
  if (!user) throw new Error(`Cant find user with email: ${config.slack.userEmail}`);

  const userId = user.id;
  if (!userId) throw new Error(`Cant find id in user: ${JSON.stringify(user, undefined, 2)}`);

  const conversation = await findConversationWithUser(userId);
  if (!conversation) throw new Error(`Cant find conversation with user: ${userId}`);

  const convId = conversation.id;
  if (!convId) throw new Error(`Cant find id in conversation: ${JSON.stringify(conversation, undefined, 2)}`);

  const history = await fetchHistory(convId);

  ensurePath(`im/${convId}`);
  saveJsonToFile(history, `im/${convId}/history.json`);
}
