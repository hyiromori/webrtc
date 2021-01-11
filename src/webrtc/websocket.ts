const WS_URL = 'wss://websocket.hyiromori.com/';

type WebSocketStatus = 'Connecting' | 'Open' | 'Ready' | 'Closing' | 'Closed' | 'Disconnected'

type SendInfoType = {
  type: 'info',
}

type InfoType = {
  type: 'info';
  data: {
    connectionId: string;
    groupIds: string[];
  }
}

type JoinType = {
  type: 'join',
  to: string,
};

type JoinedType = {
  type: 'joined',
  groupId: string,
};

type LeaveType = {
  type: 'leave',
  from: string,
};

type LeavedType = {
  type: 'leaved',
  groupId: string,
};

type UnicastType = {
  type: 'unicast',
  to: string,
  payload: any,
}

type BroadcastType = {
  type: 'broadcast',
  to: string,
  payload: any,
}

type SendType = SendInfoType | JoinType | LeaveType | BroadcastType | UnicastType;
export type ReceiveType = InfoType | JoinedType | LeavedType | BroadcastType | UnicastType;

class WebSocketWrapper {
  connectionId: (string | null) = null
  listener: (((message: ReceiveType) => void) | null) = null
  webSocket: (WebSocket | null) = null

  constructor() {
    this.reconnect()
  }

  setListener = (listener: (message: ReceiveType) => (void | Promise<void>) | null) => {
    this.listener = listener
  }

  close = (): void => {
    if (this.webSocket != null) {
      this.webSocket.close()
      this.webSocket = null
      console.info('[WS] WebSocket closed.')
      return
    }
    console.debug('[WS] WebSocket already closed.')
  }

  getId = (): (string | null) => {
    return this.connectionId
  }

  getState = (): WebSocketStatus => {
    if (this.webSocket != null) {
      switch (this.webSocket.readyState) {
        case 0:
          return 'Connecting'
        case 1:
          if (this.connectionId == null) {
            return 'Open'
          }
          return 'Ready'
        case 2:
          return 'Closing'
        case 3:
          return 'Closed'
      }
    }
    return 'Disconnected'
  }

  reconnect = (): void => {
    if (this.webSocket != null) {
      this.close()
    }
    this.webSocket = new WebSocket(WS_URL)
    this.webSocket.onmessage = (event: MessageEvent) => this.onMessage(event)
    this.webSocket.onopen = (event: Event) => {
      console.info('[WS] WebSocket open:', event)
      this.send({type: 'info'})
    }
    this.webSocket.onerror = (event: Event) => {
      console.error('[WS] WebSocket error:', event)
      this.close()
    }
    this.webSocket.onclose = (event: CloseEvent) => {
      console.error('[WS] WebSocket closed:', event)
      this.close()
    }
  }

  send = (message: SendType): void => {
    if (this.webSocket == null) {
      console.error('[WS] Cannot send message because WebSocket is closed.')
      return
    }
    console.debug('[WS] Send message:', JSON.stringify(message))
    this.webSocket.send(JSON.stringify(message))
  }

  onMessage = (event: MessageEvent): void => {
    console.debug('[WS] Receive message:', event.data)
    const response: ReceiveType = JSON.parse(event.data)
    switch (response.type) {
      case 'info':
        this.connectionId = response.data.connectionId
        console.info('[WS] WebSocket Connection ID:', this.connectionId)
        break
      case 'unicast':
      case 'joined':
      case 'leaved':
        if (this.listener != null) {
          this.listener(response)
        }
        break
      case 'broadcast':
        if (this.listener != null && response.payload?.from !== this.connectionId ) {
          this.listener(response)
        }
        break
      default:
        console.error('[WS] Unknown response:', response)
    }
  }
}

export const webSocket = new WebSocketWrapper()
