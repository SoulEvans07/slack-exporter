import {
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersListResponse,
  UsersLookupByEmailResponse,
  WebAPICallResult,
  WebClient,
} from '@slack/web-api';

import { PickType, ResolvedValue, ReturnValue } from '../../types/utility';
import { config } from '../../const/config';
import { Member } from '@slack/web-api/dist/response/UsersListResponse';

interface PaginateResponse {
  response_metadata?: {
    next_cursor?: string;
  };
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

export async function getHistory(conversationId: string) {
  const callback = (cursor?: string) =>
    client.conversations.history({
      channel: conversationId,
      cursor,
    });
  return resolvePagination(callback, 'messages');
}

// async function findConversation(name: string) {
//   try {
//     const result = await client.conversations.list();

//     if (!result.channels) return null;

//     const conversation = result.channels

//     for (const channel of result.channels) {
//       if (channel.name === name) {
//         conversationId = channel.id;

//         // Print result
//         console.log("Found conversation ID: " + conversationId);
//         // Break from for loop
//         break;
//       }
//     }
//   }
//   catch (error) {
//     console.error(error);
//   }
// }
