import { v4 as uuid } from 'uuid';

const WS_URL = 'wss://web-socket.arukascloud.io/ws';

type WebSocketStatus = 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Disconnected'

type PingType = {
  requestId: string,
  type: 'ping',
};

type PongType = {
  requestId: string,
  type: 'pong',
};

type InfoType = {
  type: 'info',
  id: string,
}

type SendJoinType = {
  requestId: string,
  type: 'join',
  group: string,
};

type ReceiveJoinType = {
  requestId: string,
  type: 'join',
  group: string,
  from: string,
};

type SendLeaveType = {
  requestId: string,
  type: 'leave',
  group: string,
};

type ReceiveLeaveType = {
  requestId: string,
  type: 'leave',
  group: string,
  from: string,
};

type SendMessageType = {
  requestId: string,
  type: 'message',
  group: string,
  to?: string,
  message: any,
}

type ReceiveMessageType = {
  requestId: string,
  type: 'message',
  from: string,
  message: any,
}

type SendType = PingType | SendJoinType | SendLeaveType | SendMessageType;
type ReceiveType = InfoType | PongType | ReceiveJoinType | ReceiveLeaveType | ReceiveMessageType;

class WebSocketWrapper {
  connectionId: (string | null) = null;
  intervalId: (NodeJS.Timer | null) = null;
  listener: (((message: ReceiveType) => void) | null) = null;
  waitConnectivityId: (string | null) = null;
  webSocket: (WebSocket | null) = null;

  constructor() {
    this.reconnect();
    this.intervalId = setInterval(() => {
      if (this.webSocket == null) {
        this.reconnect();
      } else {
        // this.checkConnectivity();
      }
    }, 5000);
  }

  setListener = (listener: (message: ReceiveType) => void | null) => {
    this.listener = listener;
  };

  closeWebSocket = (): void => {
    if (this.webSocket != null) {
      this.webSocket.close();
      this.webSocket = null;
    }
  };

  close = (): void => {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
    }
    this.closeWebSocket();
  };

  getId = (): (string | null) => {
    return this.connectionId;
  };

  getState = (): WebSocketStatus => {
    if (this.webSocket != null) {
      switch (this.webSocket.readyState) {
        case 0:
          return 'Connecting';
        case 1:
          return 'Open';
        case 2:
          return 'Closing';
        case 3:
          return 'Closed';
      }
    }
    return 'Disconnected';
  };

  reconnect = (): void => {
    if (this.webSocket != null) {
      return;
    }
    this.webSocket = new WebSocket(WS_URL);
    this.webSocket.onmessage = (event: MessageEvent) => this.onMessage(event);
    this.webSocket.onopen = (event: Event) => {
      console.debug('WebSocket Open:', event);
      // this.checkConnectivity();
    };
    this.webSocket.onerror = (event: Event) => {
      console.error('WebSocket Error:', event);
      this.closeWebSocket();
    };
    this.webSocket.onclose = (event: CloseEvent) => {
      console.error('WebSocket Closed:', event);
      this.closeWebSocket();
    };
  };

  checkConnectivity = (): void => {
    const waitConnectivityId = uuid();
    this.send({ requestId: waitConnectivityId, type: 'ping' });
    this.waitConnectivityId = waitConnectivityId;

    setTimeout(() => {
      if (this.waitConnectivityId === waitConnectivityId && this.webSocket != null) {
        this.webSocket.close();
        this.webSocket = null;
      }
    }, 3000);
  };

  send = (message: SendType): void => {
    if (this.webSocket == null) {
      return;
    }
    this.webSocket.send(JSON.stringify(message));
  };

  onMessage = (event: MessageEvent): void => {
    const response: ReceiveType = JSON.parse(event.data);
    switch (response.type) {
      case 'info':
        this.connectionId = response.id;
        console.info('WebSocket Connection ID:', response.id);
        break;

      case 'pong':
        if (this.waitConnectivityId === response.requestId) {
          this.waitConnectivityId = null;
        }
        break;

      case 'join':
      case 'message':
      case 'leave':
        if (this.listener != null) {
          this.listener(response);
        }
        break;

      default:
    }
  };
}

const webSocket = new WebSocketWrapper();
export {
  ReceiveType,
  webSocket,
};