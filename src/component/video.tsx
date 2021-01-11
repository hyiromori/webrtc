import React, {
  useState,
  useEffect,
} from 'react'
import styled from 'styled-components'

interface Props {
  srcObject: (MediaStream | null)
  muted?: boolean
}

const StyledVideo = styled.video`
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  width: 100%;
`

export const Video: React.FC<Props> = (props) => {
  const { srcObject, muted } = props
  const [self, setSelf] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (self != null) {
      self.srcObject = srcObject
    }
  }, [srcObject, self])

  return (
    <StyledVideo ref={setSelf} autoPlay playsInline muted={muted || false} />
  )
}
