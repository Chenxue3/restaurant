'use client'
import { API_URL } from "@/lib/constants"
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Bot, X, Send } from 'lucide-react'
import Link from 'next/link'

type Message = {
  role: 'user' | 'assistant'
  content: string | React.ReactNode
  error?: boolean
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDefaultQuestions, setShowDefaultQuestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Welcome to our website!</h3>
            <p className="text-muted-foreground">
              You can ask me any questions related to food & restaurants!
            </p>
          </div>
        )
      }])
    }
  }, [isOpen, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const defaultQuestions = [
    "What is the food allergy information of roasted beef?",
    "What is the best Chinese restaurant in town?",
    "What is the best meal combination for 2-person dinner within $40?"
  ]

  const formatResponse = (text: string) => {

    const linkRegex = /<a href="([^"]+)">([^<]+)<\/a>/g

    return text.split('\n').map((line, index) => {

      if (linkRegex.test(line)) {

        linkRegex.lastIndex = 0
        const parts: (string | React.ReactNode)[] = []
        let lastIndex = 0
        let match
        while ((match = linkRegex.exec(line)) !== null) {

          if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index))
          }

          parts.push(
            <Link key={match[1] + match[2] + index} href={match[1]} className="text-primary underline hover:text-primary/80">
              {match[2]}
            </Link>
          )
          lastIndex = match.index + match[0].length
        }

        if (lastIndex < line.length) {
          parts.push(line.slice(lastIndex))
        }
        return <p key={index} className="text-muted-foreground">{parts}</p>
      }

      return <p key={index} className="text-muted-foreground">{line}</p>
    })
  }

  const handleSend = async (message: string) => {
    if (!message.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: message }])
    setInput('')
    setIsLoading(true)
    setShowDefaultQuestions(false)

    try {
      const response = await fetch(`${API_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: 'en' }),
      })

      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'API request failed')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: formatResponse(data.response)
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Request failed, please try again',
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setMessages([])
      setShowDefaultQuestions(true)
    }
  }

  const handleBack = () => {
    setShowDefaultQuestions(true)
    setMessages([{
      role: 'assistant',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Welcome to our website!</h3>
          <p className="text-muted-foreground">
            You can ask me any questions related to food & restaurants 😄!
          </p>
        </div>
      )
    }])
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <Card
          style={{
            width: '50vw',
            height: '66vh', // 2/3 of viewport height
            minWidth: 320,
            minHeight: 320,
            maxWidth: 600,
            maxHeight: 800,
            overflowX: 'hidden',
          }}
          className="flex flex-col shadow-xl pt-0"
        >
          <CardHeader className="bg-primary text-primary-foreground py-4 text-center rounded-none relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h3 className="font-semibold text-lg text-center flex-1">AI Restaurant Assistant</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleToggle} data-testid="close-button">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
            {showDefaultQuestions ? (
              <>
                {/* Welcome message always on top */}
                <div className="mb-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Welcome to our website!</h3>
                    <p className="text-muted-foreground">
                      You can ask me any questions related to food & restaurants!
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {defaultQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="text-left h-auto py-2 px-3 justify-start whitespace-normal min-h-[50px]"
                      onClick={() => handleSend(q)}
                    >
                      <span className="text-wrap">{q}</span>
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${msg.error ? 'border border-red-500' : ''}`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend(input)
                }}
                placeholder="Ask me anything..."
                disabled={isLoading}
              />
              <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} size="icon" data-testid="send-button">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      {!isOpen && (
        <Button
          className="rounded-full p-3 h-12 w-12 shadow-lg hover:shadow-xl transition-shadow"
          onClick={handleToggle}
          data-testid="chat-toggle-button"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}