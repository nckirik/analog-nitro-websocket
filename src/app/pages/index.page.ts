import { ChangeDetectionStrategy, Component, WritableSignal, computed, signal } from '@angular/core';
import { uniqueNamesGenerator as uGenerator, names as uNames } from 'unique-names-generator';

//import { FormsModule, NgForm } from '@angular/forms';

import { type ChatMessage, ConnectionStatus } from '../../types';

@Component({
  selector: 'app-home',
  standalone: true,
  //  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-column h-100">
      <div class="container flex h-2rem border-group">
        <input
          class="border flex-1"
          placeholder="Enter a Username"
          [readonly]="!isDisconnected()"
          [value]="userName()"
          (change)="setSignalValue(userName, $event)"
        />
        <div class="border flex-1 bg-white p-1">{{ status() }}</div>
        <button class="border bg-blue" style="width: 8rem" [disabled]="isConnecting()" (click)="connect()" [class]="statusClass()">
          {{ isConnected() ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
      <div class="container flex-1 border bg-white p-1">
        @if (messages(); as messages) {
          @for (message of messages; track message) {
            @if (message.userName === 'Server') {
              <div class="info">Server: {{ message.text }}</div>
            } @else {
              <div class="container border-group flex message">
                <div class="border">{{ message.userName }}</div>
                <div class="border flex-1">{{ message.text }}</div>
                <div class="border info">{{ message.timestamp }}</div>
              </div>
            }
          }
        } @else {
          <div><em>Not Connected</em></div>
        }
      </div>
      <div class="container flex h-2rem border-group">
        <input
          class="border flex-1 bg-white"
          placeholder="Enter a Message"
          [readonly]="!isConnected()"
          [value]="message()"
          (change)="setSignalValue(message, $event)"
        />
        <button class="border bg-blue" style="width: 8rem" [disabled]="!isConnected()" (click)="send()">Send</button>
      </div>
    </div>
  `,
})
export default class HomeComponent {
  messages = signal<ChatMessage[] | undefined>(undefined);
  status = signal<ConnectionStatus>(ConnectionStatus.Disconnected);
  isConnected = computed(() => this.status() === ConnectionStatus.Connected);
  isConnecting = computed(() => this.status() === ConnectionStatus.Connecting);
  isDisconnected = computed(() => this.status() === ConnectionStatus.Disconnected);
  statusClass = computed(() => {
    if (this.isConnected()) return 'bg-green';
    if (this.isConnecting()) return 'bg-blue';
    return 'bg-red';
  });

  userName = signal<string>('');
  message = signal<string>('');
  setSignalValue = (signal: WritableSignal<string>, event: Event) => signal.set((event.target as HTMLInputElement)?.value ?? '');

  ws: WebSocket | undefined;

  constructor() {
    this.userName.set(uGenerator({ dictionaries: [uNames] }));
  }

  connect() {
    if (this.ws) this.ws.close();
    this.ws = undefined;

    if (this.isConnected()) {
      this.status.set(ConnectionStatus.Disconnected);
      return;
    }

    this.status.set(ConnectionStatus.Connecting);

    const isSecure = location.protocol === 'https:';
    const url = (isSecure ? 'wss://' : 'ws://') + location.host + '/api/ws/chat?userName=' + this.userName();

    this.ws = new WebSocket(url);
    this.ws.addEventListener('open', (event) => this.onWsOpen(event));
    this.ws.addEventListener('message', (event) => this.onWsMessage(event.data));
    this.ws.addEventListener('close', (event) => this.onWsClose(event));
    this.ws.addEventListener('error', (event) => this.onWsError(event));
  }

  send() {
    if (!this.isConnected()) return;
    if (!this.userName()) return;
    if (!this.message()) return;
  }

  onWsOpen(event: Event) {
    console.info('WS Open', event);
    this.status.set(ConnectionStatus.Connected);
  }

  onWsMessage(data: ChatMessage | string) {
    console.info('WS Message', data);

    if (typeof data === 'string') {
      if (!data.startsWith('{')) {
        console.log(data);
        return;
      }
      const parsed = JSON.parse(data) as ChatMessage;
      if (!parsed) {
        console.error('WS Message Parse Error', parsed);
        return;
      }

      data = parsed;
    }
    this.messages.update((messages) => [...(messages ?? []), data]);
  }

  onWsClose(event: CloseEvent) {
    console.info('WS Closed', event.code, event.reason);

    if (this.ws) this.ws = undefined;
  }

  onWsError(event: Event) {
    console.error('WS Error', event);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.status.set(ConnectionStatus.Disconnected);
    }
  }
}
