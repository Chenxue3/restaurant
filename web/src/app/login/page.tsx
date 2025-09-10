"use client"

import { useRouter } from "next/navigation"
import LoginDialog from "@/components/LoginDialog"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-8">
        <LoginDialog open={true} onOpenChange={() => router.push('/')} />
    </div>
  )
} 