import React from 'react'
import styled from 'styled-components'
import { Video } from './video'

interface Props {
  self: MediaStream
  peers: MediaStream[]
  type: 'basic'
}

const Wrapper = styled.div`
  bottom: 0;
  display: flex;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const FloatVideoWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  min-height: 50%;
  min-width: 50%;
`

const FixRightBottom = styled.div`
  align-items: flex-end;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  max-height: 10vh;
  max-width: 10vw;
  position: absolute;
  right: 0;
`

export const Layout: React.FC<Props> = (props) => {
  const { self, peers, type } = props

  switch (type) {
    case 'basic':
      return (
        <Wrapper>
          {peers.map(peer => (
            <FloatVideoWrapper>
              <Video srcObject={peer} />
            </FloatVideoWrapper>
          ))}
          <FixRightBottom>
            <Video srcObject={self} muted />
          </FixRightBottom>
        </Wrapper>
      )
    default:
      return null
  }
}
