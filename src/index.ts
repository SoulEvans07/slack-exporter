import './polyfills';
import { config } from './const/config';
import { clearSync, ensurePath, saveJsonToFile, setupFolders } from './services/files';
import { getHistory, findUserByEmail, findConversationWithUser, listConversations } from './services/slack';

main();

async function main() {
  // clearSync();
  // setupFolders();

  await savePrivate();
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
