import path from 'path';

import './polyfills';
import { config } from './const/config';
import { ensurePath, saveJsonToFile, setupFolders } from './services/files';
import {
  getHistory,
  findUserByEmail,
  findConversationWithUser,
  listConversations,
  listUsers,
  buildUserMap,
} from './services/slack';

main();

async function main() {
  // clearSync();
  setupFolders();

  console.log('[users] fetch...');
  const userList = await listUsers();
  const users = buildUserMap(userList);
  console.log(`[users] found ${userList.length}`);

  console.log('get converstaions...');
  const conversations = await listConversations();

  console.log(`exporting ${conversations.length} conversations`);
  for (const chat of conversations) {
    if (chat.id == undefined) {
      console.error(`chat missing id`, chat);
      continue;
    }

    const visibility = chat.is_private ? 'private' : 'public';
    const type = chat.is_channel
      ? 'channel'
      : chat.is_group || chat.is_mpim
      ? 'group'
      : chat.is_im
      ? 'direct'
      : 'unknown';

    const user = !!chat.user ? users[chat.user] : undefined;
    const name = chat.is_channel
      ? '#' + chat.name
      : chat.is_group || chat.is_mpim
      ? 'group'
      : chat.is_im
      ? '@' + user?.name || chat.id
      : 'unknown';

    console.log(`[${chat.id}] ${name} - ${visibility}/${type}`);
    const folder = path.join(visibility, type, name);
    ensurePath(folder);
    saveJsonToFile(chat, path.join(folder, 'meta.json'));

    console.log(`[${chat.id}] exporting...`);
    const history = await getHistory(chat.id);
    console.log(`[${chat.id}] saving...`);
    saveJsonToFile(history, path.join(folder, 'history.json'));
    console.log(`[${chat.id}] done!\n`);
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

  const history = await getHistory(convId);

  ensurePath(`im/${convId}`);
  saveJsonToFile(history, `im/${convId}/history.json`);
}
