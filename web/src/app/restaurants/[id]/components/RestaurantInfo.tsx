import { MapPin, Phone, Star, Clock } from "lucide-react"

interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface OpeningHour {
  day: string
  open: string
  close: string
  isClosed: boolean
}

interface ContactInfo {
  phone?: string
  email?: string
  website?: string
}

interface RestaurantInfoProps {
  description: string
  address: string | Address
  contactInfo: ContactInfo
  openingHours: OpeningHour[]
  cuisineType: string[]
  priceRange: string
  rating: number
  hasStudentDiscount: boolean
}

export default function RestaurantInfo({
  description,
  address,
  contactInfo,
  openingHours,
  cuisineType,
  priceRange,
  rating,
  hasStudentDiscount,
}: RestaurantInfoProps) {
  const formatAddress = (address: string | Address): string => {
    if (typeof address === "string") {
      return address
    }
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean)
    return parts.join(", ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">About</h2>
        <p className="text-gray-700">{description}</p>
      </div>

      {address && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Location</h2>
          <div className="flex items-start">
            <MapPin className="text-gray-500 mt-1 mr-2" size={18} />
            <p className="text-gray-700">{formatAddress(address)}</p>
          </div>
        </div>
      )}

      {contactInfo && Object.values(contactInfo).some(Boolean) && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Contact</h2>
          {contactInfo.phone && (
            <div className="flex items-center mb-2">
              <Phone className="text-gray-500 mr-2" size={18} />
              <p className="text-gray-700">{contactInfo.phone}</p>
            </div>
          )}
          {contactInfo.email && (
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-gray-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-700">{contactInfo.email}</p>
            </div>
          )}
          {contactInfo.website && (
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-gray-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <a
                href={contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500"
              >
                {contactInfo.website}
              </a>
            </div>
          )}
        </div>
      )}

      {openingHours && openingHours.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Opening Hours</h2>
          <div className="space-y-2">
            {openingHours.map((hours, idx) => (
              <div key={idx} className="flex">
                <Clock className="text-gray-500 mt-1 mr-2" size={18} />
                <div>
                  <p className="font-medium text-gray-700">{hours.day}</p>
                  <p className="text-gray-600">
                    {hours.isClosed ? "Closed" : `${hours.open} - ${hours.close}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="font-bold text-lg mb-3">Additional Information</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Cuisine</span>
            <span className="font-medium">{cuisineType.join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price Range</span>
            <span className="font-medium">{priceRange}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rating</span>
            <span className="font-medium flex items-center">
              <Star size={16} className="text-yellow-400 mr-1" />
              {rating.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student Discount</span>
            <span
              className={`font-medium ${hasStudentDiscount ? "text-green-600" : "text-red-600"
                }`}
            >
              {hasStudentDiscount ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {hasStudentDiscount && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-2 text-indigo-700">
            Student Discount Available
          </h2>
          <p className="text-indigo-600">
            This restaurant offers special discounts for students. Remember to
            bring your student ID!
          </p>
        </div>
      )}
    </div>
  )
}
