import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import styled from 'styled-components'

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

const App: React.FC = () => {
  const [room, onChangeRoom] = useState(uuid())

  return (
    <Wrapper>
      <Header>
        Room:
        <RoomInput type="text" value={room} onChange={(ev): void => onChangeRoom(ev.target.value)} />
      </Header>
      <Content>
        CONTENT
      </Content>
    </Wrapper>
  )
}


export default App
