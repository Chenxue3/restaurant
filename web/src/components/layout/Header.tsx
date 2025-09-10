"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { ROUTES } from "@/lib/constants"
import { Menu, X, LogOut, User, Scan, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoginDialog from "@/components/LoginDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={ROUTES.HOME} className="text-2xl font-bold flex items-center gap-2">
              <ChefHat size={28} className="text-primary" />
              <span>SmartSavor</span>
            </Link>
          </div>

          {/* User menu for desktop */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated && (
              <Button
                variant="ghost"
                className="text-gray-700 hover:bg-gray-100"
                asChild
              >
                <Link href="/scan-menu">
                  <Scan size={18} className="mr-2" />
                  <span>Scan Menu</span>
                </Link>
              </Button>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center text-gray-700 hover:text-gray-900"
                >
                  <Avatar>
                    {user?.profileImage ? (
                      <AvatarImage src={user.profileImage} alt={user.name || "User"} />
                    ) : (
                      <AvatarFallback className="bg-gray-200">
                        <User size={16} className="text-gray-700" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="ml-2">{user?.name || "Profile"}</span>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={18} />
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href={ROUTES.HOME}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                href="/scan-menu"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Scan Menu
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.PROFILE}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsLoginOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setIsLoginOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Manage My Restaurant
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  )
} 