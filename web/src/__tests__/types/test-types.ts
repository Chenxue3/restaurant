export type MockImageProps = {
  src: string
  alt?: string
  width?: number
  height?: number
  [key: string]: unknown
}

export type MockQRCodeProps = {
  value: string
  imageSettings?: {
    src: string
    [key: string]: unknown
  }
  [key: string]: unknown
} 