import Image from "next/image"

interface PhotosProps {
  images: string[]
  restaurantName: string
}

export default function Photos({ images, restaurantName }: PhotosProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900">Photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, idx) => (
          <div key={idx} className="aspect-square rounded-lg overflow-hidden relative">
            <Image
              src={image}
              alt={`${restaurantName} photo ${idx + 1}`}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
