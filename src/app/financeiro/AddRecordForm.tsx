import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Record } from "./page"
import { Save } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from"@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { SearchContact } from '@/components/SearchContact';
import { Contact } from '@/app/data/contact'
import { useAuth } from '@/context/AuthContext'

const paymentMethods = ["Cartão Crédito", "Cartão Débito", "Pix", "Boleto", "Dinheiro"]

type AddRecordFormProps = {
  onAddRecord: (record: Record) => void
}

export default function AddRecordForm({ onAddRecord }: AddRecordFormProps) {
  const { provAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [amount, setAmount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [dateOpen, setDateOpen] = useState(false);
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
    if (provAuthenticated !== 0) {
      const today = new Date()
      setDate(today)
      fetchContacts()
    }
  }, [provAuthenticated, fetchContacts])

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    const formattedValue = (Number.parseInt(numericValue) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    return formattedValue
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    setAmount(rawValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_provider: provAuthenticated,
          id_user: selectedContact,
          payment_date: date,
          payment_value: Number.parseInt(amount) / 100,
          payment_type: paymentMethods.indexOf(paymentMethod),
          user_name: description
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save record')
      }

      const fetchedFinance = await response.json();
      const newRecord: Record = {
        id: fetchedFinance.id,
        payment_date: fetchedFinance.payment_date,
        payment_value: fetchedFinance.payment_value,
        payment_type_name: paymentMethod,
        user_name: description,
        status: fetchedFinance.status
      }
      onAddRecord(newRecord)
      setAmount("0")
      setPaymentMethod("")
      toast({
        variant: "default",
        title: "Sucesso",
        description: "Pagamento adicionado!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar o pagamento. Por favor, tente novamente!",
        duration: 3000,
      });
      return
    }
  }

  return (
    <Card className="mb-4 bg-white shadow-[12px] relative">
      <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
        <CardTitle>Registro de Recebimentos</CardTitle>
        <CardDescription className="text-gray-200">
          Informe os dados para cadastrar um novo recebimento
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex items-center">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[120px] justify-center text-center font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? (
                    format(date, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Informar Data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(value) => {
                    if (value) {
                      setDate(value);
                    }
                    setDateOpen(false);
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <Input
              type="text" 
              placeholder="Valor"
              value={formatCurrency(amount)}
              onChange={handleAmountChange}
              required
            />
          </div>
        </div>
        <br/>

        <div>
          <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
            <SelectTrigger>
              <SelectValue placeholder="Forma de Pagamento" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <br/>

        <div className="space-y-2">
          <SearchContact 
            suggestions={contacts}
            onSelect={(contact) => {
              setSelectedContact(Number(contact.id));
              setDescription(contact.name);
            }}
          />
        </div>
        <br/>

        <Button
          className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
          onClick={handleSubmit}
          type="button"
        >
          <Save className="mr-2 h-4 w-4" />Adicionar Recebimento
        </Button>
      </CardContent>
    </Card>
  )
}

