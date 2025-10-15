import { Message } from '@/app/data/message'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <div className={`flex w-full ${message.is_sent ? 'justify-start' : 'justify-end'} mb-4`}>
      <Card className={`max-w-[80%] ${message.is_sent ? 'bg-[var(--secondary-color)]' : 'bg-[var(--complementary-color)]'}`}>
        <CardContent className="p-2">
          <div className={`font-medium ${message.is_sent ? 'text-[var(--primary-color)]' : 'text-white'} mb-1`}>
            {message.name}
          </div>
          <div className={`text-xs mt-2 ${message.is_sent ? 'text-gray-600' : 'text-white'} whitespace-pre-wrap`}>
            {message.message}
          </div>
          <div className={`text-xs mt-2 ${message.is_sent ? 'text-gray-400' : 'text-gray-200'}`}>
          {format(new Date(message.time_server), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
