import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { v4 as uuid } from 'uuid'
import styled from 'styled-components'
import { WebRTC } from './webrtc/webrtc'
import { Video } from './component/video'
import { Layout } from './component/layout'

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

const Header = styled.header`
  align-items: center;
  border-bottom: 1px solid silver;
  display: flex;
  height: 3rem;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  text-align: center;
  top: 0;
`

const RoomInput = styled.input`
  border: 0 solid silver;
  border-width: 0 0 1px 0; 
  font-size: 1rem;
  text-align: center;
  width: 24rem;
  padding: 0.25rem;
`

const Content = styled.main`
  left: 0;
  top: 3rem;
  position: fixed;
  right: 0;
  bottom: 0;
`

let webrtc: (WebRTC | null) = null
const Index: React.FC = () => {
  const [room, onChangeRoom] = useState(uuid())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([])

  const onConnect = async () => {
    if (webrtc != null) {
      webrtc.stop()
    }
    webrtc = new WebRTC(room, (streams) => {
      setRemoteStreams(streams)
    })
    const stream = await webrtc.start()
    setLocalStream(stream)
  }

  const onDisconnect = () => {
    if (webrtc != null) {
      webrtc.stop()
    }
    webrtc = null
  }

  return (
    <Wrapper>
      <Header>
        Room:
        <RoomInput
          type="text"
          value={room}
          onChange={(event: any): void => onChangeRoom(event.target.value)}
        />
        <button onClick={onConnect}>接続</button>
        <button onClick={onDisconnect}>切断</button>
      </Header>
      <Content>
        <Layout self={localStream} peers={remoteStreams} type="basic" />
      </Content>
    </Wrapper>
  )
}

ReactDOM.render(<Index />, document.getElementById('app'))
