import { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRCodeProps {
  url: string
  logoImage?: string
  restaurantName: string
}

export default function QRCode({ url, logoImage, restaurantName }: QRCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null)

  const handleDownloadQrCode = () => {
    const canvas = qrCodeRef.current?.querySelector("canvas")
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = `${restaurantName}-qrcode.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Restaurant QR Code</h2>
      <p className="text-gray-700 mb-6">
        Scan this QR code to access the restaurant page on your mobile device.
      </p>
      <div className="flex justify-center">
        <div
          className="p-8 border border-gray-200 rounded-lg shadow-sm bg-white"
          ref={qrCodeRef}
        >
          <QRCodeCanvas
            value={url}
            size={256}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
            imageSettings={{
              src: logoImage || "/favicon.ico",
              x: undefined,
              y: undefined,
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={handleDownloadQrCode}>
          <Download className="mr-2 h-4 w-4" /> Download QR Code
        </Button>
      </div>
    </div>
  )
} 