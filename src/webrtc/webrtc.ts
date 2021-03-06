import {
  ReceiveType,
  webSocket,
} from './websocket'

const CONFIG = {
  sdpSemantics: 'unified-plan',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

type JoinMessage = {
  type: 'join',
  from: string
}

type LeaveMessage = {
  type: 'leave',
  from: string
}


type SdpMessage = {
  type: 'sdp',
  from: string,
  sdp: any,
}

type CandidateMessage = {
  type: 'candidate',
  from: string,
  candidate: any,
}
export type SignalingMessage = SdpMessage | CandidateMessage;
type PeerInfo = { connection: RTCPeerConnection, stream?: MediaStream }

const stopStream = (stream: MediaStream | null | undefined): void => {
  if (stream != null) {
    stream.getVideoTracks().forEach(track => track.stop())
    stream.getAudioTracks().forEach(track => track.stop())
  }
}

export class WebRTC {
  room: string
  localStream: (MediaStream | null) = null
  peers: { [peerId: string]: PeerInfo } = {}
  onChangeRemoteStreams: (streams: Array<MediaStream>) => void

  constructor(room: string, onChangeRemoteStreams: (streams: Array<MediaStream>) => void) {
    this.room = room
    this.onChangeRemoteStreams = onChangeRemoteStreams

    webSocket.setListener(async (message: ReceiveType) => {
      switch (message.type) {
        case 'joined':
          webSocket.send({type: 'broadcast', to: this.room, payload: {type: 'join', from: webSocket.getId()}})
          break
        case 'broadcast':
          if (message?.payload?.type === 'join') {
            const { from } = (message.payload as JoinMessage)
            this.getPeerInfo(from, true)
          } else if (message?.payload?.type === 'leave') {
            const { from } = (message.payload as LeaveMessage)
            this.leavePeer(from)
          }
          break
        case 'unicast':
          const payload: SignalingMessage = message.payload
          await this.receiveSignalingMessage(payload)
          break
        default:
          console.debug('[WebRTC] Through message:', message)
      }
    })
  }

  sendSignalingMessage = (to: string, message: SignalingMessage): void => {
    webSocket.send({ type: 'unicast', to, payload: message })
  }

  start = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    this.localStream = stream
    webSocket.send({ type: 'join', to: this.room })
    return stream
  }

  stop = (): void => {
    stopStream(this.localStream)
    Object.keys(this.peers).forEach(peerId => this.leavePeer(peerId))
    webSocket.send({
      type: 'broadcast',
      to: this.room,
      payload: { type: 'leave', from: webSocket.getId() },
    })
    webSocket.send({ type: 'leave', from: this.room })
  }

  receiveSignalingMessage = async (message: SignalingMessage) => {
    const peerId = message.from
    const peerConnection = this.getPeerInfo(peerId).connection
    switch (message.type) {
      case 'sdp':
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
        const from = webSocket.getId()
        if (peerConnection?.remoteDescription?.type === 'offer' && from != null) {
          const description = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(description)
          this.sendSignalingMessage(peerId, { from, type: 'sdp', sdp: description })
        }
        break
      case 'candidate':
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
        break
    }
  }

  remoteStreams = (): Array<MediaStream> => {
    const streams = Object.values(this.peers).map(peer => peer.stream)
    return streams.filter(stream => stream != null) as Array<MediaStream>
  }

  leavePeer = (peerId: string): void => {
    const peerInfo = this.peers[peerId]
    if (peerInfo != null) {
      const { connection, stream } = peerInfo
      delete this.peers[peerId]
      connection.close()
      stopStream(stream)
      this.onChangeRemoteStreams(this.remoteStreams())
    }
  }

  getPeerInfo = (peerId: string, needsNegotiation: boolean = false): PeerInfo => {
    if (this.peers[peerId] == null) {
      const rtcPeerConnection = new RTCPeerConnection(CONFIG)
      rtcPeerConnection.ontrack = (event: RTCTrackEvent) => {
        event.streams.forEach(stream => this.getPeerInfo(peerId).stream = stream)
        this.onChangeRemoteStreams(this.remoteStreams())
      }
      rtcPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        const from = webSocket.getId()
        if (event.candidate != null && from != null) {
          this.sendSignalingMessage(peerId, { type: 'candidate', candidate: event.candidate, from })
        }
      }
      rtcPeerConnection.onnegotiationneeded = () => {
        const from = webSocket.getId()
        if (needsNegotiation && from != null) {
          rtcPeerConnection
            .createOffer()
            .then((description) => {
              rtcPeerConnection.setLocalDescription(description)
              this.sendSignalingMessage(peerId, { type: 'sdp', sdp: description, from })
            })
        }
      }
      if (this.localStream != null) {
        rtcPeerConnection.addTrack(this.localStream.getVideoTracks()[0], this.localStream)
      }
      this.peers[peerId] = { connection: rtcPeerConnection }
    }
    return this.peers[peerId]
  }

  enableSelfCamera = (enabled: true): boolean => {
    if (this.localStream != null) {
      this.localStream
          .getVideoTracks()
          .forEach(track => track.enabled = enabled)
      return true
    }
    return false
  }

  enableSelfMic = (enabled: true): boolean => {
    if (this.localStream != null) {
      this.localStream
          .getAudioTracks()
          .forEach(track => track.enabled = enabled)
      return true
    }
    return false
  }
}
