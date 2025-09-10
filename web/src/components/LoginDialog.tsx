'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from './ui/input'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import authAPI from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { toast, Toaster } from 'sonner'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
  title?: string
}

const LoginDialog = ({ open, onOpenChange, redirectTo, title = "Sign in to unlock your experience." }: LoginDialogProps) => {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [codeDigits, setCodeDigits] = useState(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(0)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertDescription, setAlertDescription] = useState('')
  const [alertActionText, setAlertActionText] = useState('OK')
  const alertActionCallback = useRef<() => void>(() => { })

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timeLeft])

  const validateEmail = (email: string) => {
    return email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)
  }

  const sendCode = async () => {
    if (!validateEmail(email)) {
      showAlert({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      })
      setError('Please enter a valid email address.')
      return
    }

    setIsSendingCode(true)
    try {
      setError('')
      const response = await authAPI.sendVerificationCode(email)

      if (response.data.success) {
        setIsCodeSent(true)
        setTimeLeft(60)
      } else {
        showAlert({
          title: 'Error',
          description: response.data.message || 'Failed to send verification code.',
        })
      }
    } catch (err) {
      console.error('Error sending verification code:', err)
      showAlert({
        title: 'Error',
        description: 'Failed to send verification code. Please try again later.',
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  const showAlert = ({
    title,
    description,
    actionText = 'OK',
    onAction = () => { },
  }: {
    title: string
    description: string
    actionText?: string
    onAction?: () => void
  }) => {
    setAlertTitle(title)
    setAlertDescription(description)
    setAlertActionText(actionText)
    alertActionCallback.current = () => {
      onAction()
      setAlertOpen(false)
    }
    setAlertOpen(true)
  }

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return
    setIsVerifying(true)
    setError('')

    try {
      const success = await login(email, code)

      if (success) {
        toast.success('You have successfully logged in!')

        onOpenChange(false)
        setEmail('')
        setCodeDigits(Array(6).fill(''))
        setIsCodeSent(false)

        if (redirectTo) {
          console.log('redirecting to', redirectTo)
          router.push(redirectTo)
        } else if (title === "Manage My Restaurant") {
          router.push(ROUTES.RESTAURANT_ADMIN)
        } else {
          console.log('redirecting to', ROUTES.HOME)
          router.push(ROUTES.HOME)
        }
      } else {
        toast.error('Invalid verification code')
        setCodeDigits(Array(6).fill(''))
      }
    } catch (err) {
      console.error('Error verifying code:', err)
      setError('Failed to verify code. Please try again.')
      setCodeDigits(Array(6).fill(''))
    } finally {
      setIsVerifying(false)
    }
  }

  const loginContent = (
    <div>
      <div className="text-center text-2xl sm:text-3xl md:text-4xl font-semibold text-black mb-8">
        {title}
      </div>

      <div className="flex flex-col gap-6 items-center justify-center w-full max-w-md lg:max-w-xl">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isSendingCode || (isCodeSent && timeLeft > 0)}
          className="w-full text-base sm:text-lg h-12"
        />

        <button
          className={`px-6 py-3 rounded-md w-full flex items-center justify-center gap-3 text-base sm:text-lg ${isSendingCode || (isCodeSent && timeLeft > 0)
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-black text-white hover:shadow-md'
            }`}
          onClick={sendCode}
          disabled={isSendingCode || (isCodeSent && timeLeft > 0)}
        >
          {isSendingCode ? 'Sending...' :
            isCodeSent ? (timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend') :
              'Send Verification Code'}
        </button>

        {isCodeSent && (
          <div className="w-full flex flex-col items-center gap-4 mt-6">
            <InputOTP
              maxLength={6}
              disabled={isVerifying}
              value={codeDigits.join('')}
              onChange={(value) => {
                const updated = value.split('').slice(0, 6)
                const padded = [...updated, ...Array(6 - updated.length).fill('')]
                setCodeDigits(padded)
                if (updated.length === 6 && updated.every(d => d)) {
                  handleVerify(updated.join(''))
                }
              }}
              className="w-full justify-center"
            >
              <InputOTPGroup className="gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-10 h-10 text-2xl sm:text-3xl md:text-4xl border-2 rounded-md"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && <div className="text-red-500 text-sm sm:text-base text-center mt-2">{error}</div>}

            <button
              onClick={() => handleVerify(codeDigits.join(''))}
              className={`px-6 py-3 mt-4 rounded-md w-40 sm:w-52 text-base sm:text-lg ${codeDigits.every((d) => d) && !isVerifying
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              disabled={!codeDigits.every((d) => d) || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertTitle !== 'Success' && (
              <AlertDialogCancel onClick={() => setAlertOpen(false)}>Cancel</AlertDialogCancel>
            )}
            <AlertDialogAction onClick={alertActionCallback.current}>{alertActionText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="sr-only">Login</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your email to receive a verification code for login
        </DialogDescription>
        {loginContent}
      </DialogContent>
    </Dialog>
  )
}

export default LoginDialog
