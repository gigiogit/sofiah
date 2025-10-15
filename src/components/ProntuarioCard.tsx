import { useState } from 'react'
import { Prontuario } from '@/app/data/prontuario'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, ChevronDown, ChevronUp } from 'lucide-react'

interface ProntuarioCardProps {
  prontuario: Prontuario;
  onEdit?: () => void;
}

export function ProntuarioCard({ prontuario, onEdit }: ProntuarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className='w-full mb-4'>
      <Card className='bg-white relative'>
        <div className="absolute top-2 right-2 flex items-center">
          <Button
            size="icon"
            variant="ghost"
            className="text-red-600 hover:text-red-800 hover:bg-gray-300"
            title="Editar prontuário"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-300"
            title={isExpanded ? "Esconder prontuário" : "Visualizar prontuário"}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardContent className="p-2">
          <div className='font-medium text-[var(--primary-color)] mb-1'>
            {format(new Date(prontuario.time_server), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
          </div>
          {isExpanded && (
            <div 
              className='text-xs mt-2 whitespace-pre-wrap prontuario-html-content'
              dangerouslySetInnerHTML={{ __html: prontuario.prontuario }}
              style={{
                fontSize: '12px',
                lineHeight: '1.5',
                fontFamily: 'Arial, sans-serif',
                wordBreak: 'break-word'
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
