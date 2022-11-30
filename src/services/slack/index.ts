import {
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersListResponse,
  UsersLookupByEmailResponse,
  WebAPICallResult,
  WebClient,
} from '@slack/web-api';
import { Member } from '@slack/web-api/dist/response/UsersListResponse';
import { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse';
import { Message as ThreadReply } from '@slack/web-api/dist/response/ConversationsRepliesResponse';

import { PickType, ResolvedValue, ReturnValue } from '../../types/utility';
import { config } from '../../const/config';

interface PaginateResponse {
  response_metadata?: {
    next_cursor?: string;
  };
}

interface MessageWithThread extends Message {
  replies?: ThreadReply[];
}

const client = new WebClient(config.slack.oauthToken, {
  headers: {
    'content-type': 'application/json; charset=utf-8',
  },
});

class SlackClient {
  client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }
}

export async function resolvePagination<R extends PaginateResponse>(
  fetchCallback: (cursor?: string) => Promise<R>,
  outputKey: keyof PickType<ResolvedValue<ReturnValue<typeof fetchCallback>>, unknown[]>
) {
  const list = [];

  let cursor: string | undefined;
  let response: R | undefined;
  try {
    do {
      response = await fetchCallback(cursor);

      if (response[outputKey] != undefined) list.push(response[outputKey]!);

      cursor = response.response_metadata?.next_cursor;
    } while (!!cursor);
  } catch (e) {
    console.error(e, response);
  }

  return list.flat();
}

export async function listUsers() {
  const callback = (cursor?: string) => client.users.list({ cursor });
  return resolvePagination(callback, 'members');
}

export function buildUserMap(userList: Member[]): Record<string, Member> {
  return userList.reduce((acc: Record<string, Member>, curr) => {
    if (!curr.id) return acc;
    return { ...acc, [curr.id]: curr };
  }, {});
}

export async function findUserByEmail(email: string) {
  const response = await client.users.lookupByEmail({ email });
  return response.user;
}

export async function listConversations() {
  const callback = (cursor?: string) =>
    client.conversations.list({
      types: 'im,mpim,private_channel,public_channel',
      cursor,
    });
  return resolvePagination(callback, 'channels');
}

export async function findConversationWithUser(userId: string) {
  const conversations = await listConversations();

  for (const chat of conversations) {
    if (!chat.is_im) continue;
    if (chat.user === userId) return chat;
  }

  return null;
}

export async function fetchHistory(conversationId: string) {
  const callback = (cursor?: string) =>
    client.conversations.history({
      channel: conversationId,
      cursor,
    });
  const messages = await resolvePagination(callback, 'messages');
  return populateThreads(conversationId, messages);
}

export async function populateThreads(conversationId: string, messages: Message[]) {
  const history: MessageWithThread[] = [];

  for (const message of messages) {
    const populated: MessageWithThread = message;

    if (!!populated.thread_ts && !!populated.reply_count) {
      console.log(`[${conversationId}][thread] ${populated.thread_ts}`);
      const replies = await fetchThread(conversationId, populated.thread_ts);
      populated.replies = replies;
    }

    history.push(populated);
  }

  return history;
}

export async function fetchThread(conversationId: string, ts: string) {
  const callback = (cursor?: string) =>
    client.conversations.replies({
      channel: conversationId,
      ts,
      cursor,
    });
  return resolvePagination(callback, 'messages');
}
