import { defineWebSocketHandler, createError } from 'h3';
import { getQuery } from 'ufo';
import type { Peer } from 'crossws';

import { ChatMessage } from 'src/types';

const messages: ChatMessage[] = [];
const users = new Map<string, { online: boolean }>();

export default defineWebSocketHandler({
  open(peer) {
    const timestamp = new Date();

    console.log(`[ws] open ${peer}`);

    const userName = getUserName(peer) || 'Anonymous';
    console.log(userName, 'signed in to chat!');

    users.set(userName, { online: true });
    const userCount = Array.from(users.values()).filter((u) => u.online).length;

    peer.send({
      userName: 'Server',
      text: `Hello ${userName}! Currently ${userCount} users are online`,
      timestamp,
    });
    peer.subscribe('chat');
    peer.publish('chat', {
      userName: 'Server',
      text: `${userName} logged in!`,
      timestamp,
    });
  },

  message(peer, payload) {
    const text = payload.text();
    const timestamp = new Date();

    console.log(`[ws] message ${peer} ${text}`);

    const userName = getUserName(peer);

    if (text === 'ping') {
      peer.send({ userName: 'Server', text: 'pong', timestamp });
      return;
    }

    if (Math.random() < 0.01) garbageCollect();

    const message = { userName, text, timestamp };
    messages.push(message);

    peer.send(message); // echo back
    peer.publish('chat', message);
  },

  close(peer, details) {
    const timestamp = new Date();
    console.log(`[ws] close ${peer}`, details);

    const userName = getUserName(peer);
    users.set(userName, { online: false });

    peer.publish('chat', {
      userName: 'Server',
      text: `${userName} logged out!`,
      timestamp,
    });
  },

  error(peer, error) {
    console.log(`[ws] error ${peer}`, error);
  },
});

function getUserName(peer: Peer) {
  const query = getQuery(peer.url);
  return query['userName'] as string;
}

function garbageCollect() {
  const newMessages = messages.filter((m) => m.timestamp > new Date(Date.now() - 5 * 60 * 1000));

  messages.length = 0;
  messages.push(...newMessages);
}
