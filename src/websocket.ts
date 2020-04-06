import { v4 as uuid } from 'uuid'

// const WS_URL = 'wss://websocket.hyiromori.com/';
const WS_URL = 'wss://a185bkcc38.execute-api.ap-northeast-1.amazonaws.com/prod'

type WebSocketStatus = 'Connecting' | 'Open' | 'Ready' | 'Closing' | 'Closed' | 'Disconnected'

type InfoType = {
  requestId: string,
  type: 'info',
  id: string,
}

type JoinType = {
  requestId: string,
  type: 'join',
  groupId: string,
};

type JoinedType = {
  requestId: string,
  type: 'joined',
  groupId: string,
};

type LeaveType = {
  requestId: string,
  type: 'leave',
  group: string,
};

type LeavedType = {
  requestId: string,
  type: 'leaved',
  group: string,
};

type BroadcastType = {
  requestId: string,
  type: 'broadcast',
  to: string,
  payload: any,
}

type UnicastType = {
  requestId: string,
  type: 'unicast',
  to: string,
  payload: any,
}

type SendType = InfoType | JoinType | LeaveType | BroadcastType | UnicastType;
export type ReceiveType = InfoType | JoinedType | LeavedType | BroadcastType | UnicastType;

class WebSocketWrapper {
  connectionId: (string | null) = null
  listener: (((message: ReceiveType) => void) | null) = null
  webSocket: (WebSocket | null) = null

  constructor() {
    this.reconnect()
  }

  setListener = (listener: (message: ReceiveType) => void | null) => {
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
      this.send({ requestId: uuid(), type: 'info', id: '' })
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
    console.debug('[WS] Send message:', message)
    this.webSocket.send(JSON.stringify(message))
  }

  onMessage = (event: MessageEvent): void => {
    console.debug('[WS] Receive message:', event.data)
    const response: ReceiveType = JSON.parse(event.data)
    switch (response.type) {
      case 'info':
        this.connectionId = response.id
        console.info('[WS] WebSocket Connection ID:', response.id)
      case 'broadcast':
      case 'unicast':
      case 'joined':
      case 'leaved':
        if (this.listener != null) {
          this.listener(response)
        }
        break
      default:
        console.error('[WS] Unknown response:', response)
    }
  }
}

export const webSocket = new WebSocketWrapper()
