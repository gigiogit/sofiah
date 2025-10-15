import { Message } from '@/app/data/message'
import { MessageCard } from './MessageCard'
import { useEffect, useRef } from 'react'

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  return (
    <div className="flex flex-col space-y-2 p-0 h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}