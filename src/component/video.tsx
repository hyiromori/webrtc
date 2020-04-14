import React, {
  useState,
  useEffect,
} from 'react'

interface Props {
  srcObject: (MediaStream | null)
  muted?: boolean
}

export const Video: React.FC<Props> = (props) => {
  const { srcObject, muted } = props
  const [self, setSelf] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (self != null) {
      self.srcObject = srcObject
    }
  }, [srcObject, self])

  return (
    <video ref={setSelf} autoPlay playsInline muted={muted || false} />
  )
}
