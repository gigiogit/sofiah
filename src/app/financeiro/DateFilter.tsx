import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from"@/components/ui/popover"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Filter } from 'lucide-react'
import { Contact } from '@/app/data/contact'
import { SearchContact } from '@/components/SearchContact'
import { useAuth } from '@/context/AuthContext'

type DateFilterProps = {
  onFilter: (client: string, startDate: Date, endDate: Date) => void
}

export default function DateFilter({ onFilter }: DateFilterProps) {
  const { provAuthenticated } = useAuth();
  const [copyFromDate, setCopyFromDate] = useState<Date | undefined>(new Date())
  const [copyToDate, setCopyToDate] = useState<Date | undefined>(new Date())
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyToOpen, setCopyToOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState("")
  const { toast } = useToast()

  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/contacts/${provAuthenticated}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data: Contact[] = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar pacientes. Por favor, tente novamente.",
      })
    }
  }, [provAuthenticated, toast]);

  useEffect(() => {
    const today = new Date()
    setCopyFromDate(today)
    setCopyToDate(today)
    fetchContacts()
  }, [fetchContacts])

  const handleDateFilter = () => {
    if (!copyFromDate || !copyToDate) return
    if (copyFromDate > copyToDate) {
      toast({
        variant: "destructive",
        title: "Erro de Data",
        description: "A data 'De' deve ser menor que a data 'Até'.",
        duration: 3000,
      });
      return;
    }
    const diffInDays = Math.floor((copyToDate.getTime() - copyFromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays >= 30) {
      toast({
        variant: "destructive",
        title: "Erro de Data",
        description: "A diferença entre 'De' e 'Até' deve ser menor que 30 dias.",
        duration: 3000,
      });
      return;
    }

    if (copyFromDate && copyToDate) {
      onFilter(selectedContact, copyFromDate, copyToDate)
    }
  }

  const filterCurrentWeek = () => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    setCopyFromDate(startOfWeek)
    setCopyToDate(endOfWeek)
    onFilter(selectedContact, startOfWeek, endOfWeek)
  }

  const filterCurrentDay = () => {
    const today = new Date()
    setCopyFromDate(today)
    setCopyToDate(today)
    onFilter(selectedContact, today, today)
  }

  return (
    <div>
      <Card className="mb-4 bg-white shadow-[12px] relative">
        <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
          <CardTitle>Filtro de Recebimentos</CardTitle>
          <CardDescription className="text-gray-200">
            Informe as opções de filtro para visualizar os recebimentos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <SearchContact 
              suggestions={contacts}
              onSelect={(contact) => {
                setSelectedContact(contact.name);
              }}
            />
          </div>
          <br/>

          <div className="flex space-x-4 mb-4">
            <Button
              onClick={filterCurrentDay}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white" >
              <Filter className="mr-2 h-4 w-4" /> Hoje
            </Button>
            <Button
              onClick={filterCurrentWeek}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white" >
              <Filter className="mr-2 h-4 w-4" /> Semana Atual
            </Button>
          </div>

          <div className="flex space-x-4 mb-4">
            <Button
              onClick={handleDateFilter}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white">
              <Filter className="mr-2 h-4 w-4" /> Intervalo de Datas
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">De:</span>
              </div>
              <div className="flex items-center space-x-2">
                <Popover open={copyFromOpen} onOpenChange={setCopyFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[120px] justify-center text-[var(--primary-color)] text-center font-normal",
                        !copyFromDate && "text-muted-foreground"
                      )}
                    >
                      {copyFromDate ? (
                        format(copyFromDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={copyFromDate}
                      onSelect={(value) => {
                        setCopyFromDate(value);
                        setCopyFromOpen(false);
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">Até:</span>
              </div>
              <div className="flex items-center space-x-2">
                <Popover open={copyToOpen} onOpenChange={setCopyToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[120px] justify-center text-[var(--primary-color)] text-center font-normal",
                        !copyToDate && "text-muted-foreground"
                      )}
                    >
                      {copyToDate ? (
                        format(copyToDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={copyToDate}
                      onSelect={(value) => {
                        setCopyToDate(value);
                        setCopyToOpen(false);
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

