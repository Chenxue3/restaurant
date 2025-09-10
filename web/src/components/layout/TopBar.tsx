'use client'
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import LoginDialog from "@/components/LoginDialog"

export default function TopBar() {
  const { isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleRestaurantClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      setShowLoginDialog(true)
    }
  }

  return (
    <div className="bg-slate-100 text-sm">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-8">
          <nav className="flex space-x-4">
            <Link
              href={ROUTES.RESTAURANT_ADMIN}
              className="text-gray-500 hover:text-gray-900"
              onClick={handleRestaurantClick}
            >
              For Restaurants
            </Link>
            <Link href={ROUTES.FAQS} className="text-gray-500 hover:text-gray-900">
              FAQs
            </Link>
          </nav>
        </div>
      </div>
      {showLoginDialog && (
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          redirectTo={ROUTES.RESTAURANT_ADMIN}
          title="Manage My Restaurant"
        />
      )}
    </div>
  )
} 