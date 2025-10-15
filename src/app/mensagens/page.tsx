'use client'

import { useState, useEffect, useCallback } from 'react'
import { Message } from '@/app/data/message'
import { Prontuario } from '@/app/data/prontuario'
import { Contact } from '@/app/data/contact'
import { MessageList } from '@/components/MessageList'
import { ContactList } from '@/components/ContactList'
import { ProntuarioList } from '@/components/ProntuarioList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneInput } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/context/AuthContext'
import { Input } from "@/components/ui/input"
import { User, Calendar, SendHorizontal, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from 'next/link';

const genderOptions = ["Masculino", "Feminino", "Outro"]

export default function MessageApp() {
  const { provAuthenticated, isReady } = useAuth();
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [prontuario, setProntuario] = useState<Prontuario[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [newName, setNewName] = useState('')
  const [newBirthdate, setNewBirthdate] = useState('')
  const [newGender, setNewGender] = useState('')
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [contactToRemove, setContactToRemove] = useState<Contact | null>(null)
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    checkIfMobile();
    const handleResize = () => checkIfMobile();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }, [provAuthenticated, toast]);

  useEffect(() => {
    if (provAuthenticated !== 0) {
      fetchContacts()
    }
  }, [provAuthenticated, fetchContacts])

  const fetchMessages = useCallback(async () => {
    if (selectedContactId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/contact/${selectedContactId}/${provAuthenticated}`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        const data: Message[] = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar mensagens. Por favor, tente novamente.",
        })
      }
    }
  }, [selectedContactId, provAuthenticated, toast])  

  const fetchProntuario = useCallback(async () => {
    if (selectedContactId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/prontuario/${selectedContactId}/${provAuthenticated}`)
        if (!response.ok) throw new Error('Failed to fetch prontuario')
        const data: Prontuario[] = await response.json()
        setProntuario(data)
      } catch (error) {
        console.error('Error fetching prontuario:', error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar prontuario. Por favor, tente novamente.",
        })
      }
    }
  }, [selectedContactId, provAuthenticated, toast])  

  useEffect(() => {
    if (provAuthenticated !== 0) {
      fetchMessages()
      fetchProntuario()
    }
  }, [provAuthenticated, fetchMessages, fetchProntuario])

  const onPhoneChange = (value: string) => {
    setNewPhoneNumber(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  const addContact = async () => {
    if (!newPhoneNumber) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um número de telefone.",
      })
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/addcontact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: newPhoneNumber,
          name: newName,
          birthdate: formatDate(newBirthdate),
          gender: newGender,
          provider: provAuthenticated,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Paciente já vinculado com outro profissional.",
          })
          return;
        }
        throw new Error('Falha ao adicionar paciente');
      }

      fetchContacts();
      setNewPhoneNumber('');
      setNewName('');
      setNewBirthdate('');
      setNewGender('');

      toast({
        title: "Sucesso",
        description: "Novo paciente adicionado!",
      })
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha: Paciente inexistente ou vinculado a outro profissional.",
      })
    }
  }

  const removeContact = async (contactId: string) => {
    const contact = contacts.find(contact => contact.id === contactId);
    if (contact) {
      setContactToRemove(contact)
      setIsConfirmDialogOpen(true)
    }
  }

  const confirmRemoveContact  = async () => {
    try {
      if (!contactToRemove) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/reset/${contactToRemove.id}`)
      if (!response.ok) throw new Error('Failed to remove contact')

      setContacts(contacts.filter(contact => contact.id !== contactToRemove.id))
      if (selectedContactId === contactToRemove.id) {
        setSelectedContactId(null)
      }
      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso.",
      })
    } catch (error) {
      console.error('Error removing contact:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao remover paciente. Por favor, tente novamente.",
      })
    } finally {
      setIsConfirmDialogOpen(false)
      setContactToRemove(null)
    }
  }

  const handleSendMessage = async (message: string) => {
    try {
      const phone = contacts.find(contact => contact.id === selectedContactId)?.phone;
      if (phone) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/sendmessagesofiah`, {      
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone,
            message: message,
            id_provider: provAuthenticated,
          }),
        });
        if (response.ok) {
          setMessageText('')
          await fetchMessages()
          toast({
              variant: "default",
              title: "Sucesso",
              description: "Mensagem enviada com sucesso!",
              duration: 3000,
            });
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao enviar mensagem. Por favor, tente novamente.",
        duration: 3000,
      });
    }
  }

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.slice(0,2) + '/' + value.slice(2);
    if (value.length > 5) value = value.slice(0,5) + '/' + value.slice(5,9);
    setNewBirthdate(value);
  };

  if (provAuthenticated === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-white">Você precisa estar autenticado para acessar esta página.</p>
        <Link 
          href="/login" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex items-center justify-center">
        <p className="text-lg text-white">Carregando...</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl flex items-center justify-center min-h-[400px]">
        <div className="text-white text-xl">Carregando mensagens...</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-0' : 'pt-4 space-y-4'} flex justify-center items-center`}>
      <div className={`w-full ${isMobile ? '' : 'sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]'}`}>
        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Novo Paciente</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <PhoneInput value={newPhoneNumber} onChange={onPhoneChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="name" className="sr-only">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Nome completo"
                  />
                </div>
              </div>
            </div>
            <br />
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="dataNascimento" className="sr-only">Birthdate</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="dataNascimento"
                    type="text"
                    name="dataNascimento"
                    value={newBirthdate}
                    onChange={handleBirthdateChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 min-h-[44px] h-full focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Data de Nascimento (dd/mm/aaaa)"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <Select value={newGender} onValueChange={setNewGender} required>
                  <SelectTrigger className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 min-h-[44px] h-full focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              
            </div>
            <br />

            <div className="ml-auto">
              <Button
                className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
                onClick={addContact}
              >
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <ContactList 
          contacts={contacts}
          selectedContactId={selectedContactId}
          selectedContactName={selectedContactName}
          onSelectContact={(contactId: string, contactName: string) => {
            setSelectedContactId(contactId);
            setSelectedContactName(contactName);
          }}
          onRemoveContact={removeContact}
        />

        <Card className="mb-4 bg-white shadow-[12px] relative">
          <Tabs defaultValue="mensagens" className="w-full">
            <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
              <TabsList className="mb-0 flex w-full bg-transparent border-0">
                <TabsTrigger
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[var(--primary-color)] text-white hover:text-gray-200 text-base font-semibold"                  value="mensagens"
                >
                  Mensagens
                </TabsTrigger>
                <TabsTrigger
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[var(--primary-color)] text-white hover:text-gray-200 text-base font-semibold"                  value="prontuario"
                >
                  Prontuário
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-4">
              <TabsContent value="mensagens">
                <Card className="mb-4 bg-white shadow-[12px]">
                  <CardContent className="space-y-4 pt-4">
                    <MessageList messages={messages} />
                  </CardContent>
                  <CardContent className="p-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Input
                        className="flex-grow"
                        placeholder="Digite sua mensagem..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage(messageText)
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
                        title="Enviar mensagem para WhatsApp do paciente."
                        onClick={() => {
                          handleSendMessage(messageText)
                        }}
                      >
                        <SendHorizontal className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
                        onClick={fetchMessages}
                        title="Atualizar mensagens recebidas do WhatsApp do paciente."
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prontuario">
                <Card className="mb-4 bg-white shadow-[12px]">
                  <CardContent className="space-y-4 pt-4">
                    <ProntuarioList prontuario={prontuario} fetchProntuario={fetchProntuario}/>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-gray-900">Confirmar remoção</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o paciente {contactToRemove?.name}?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Fechar</Button>
              <Button className="text-gray-900" variant="destructive" onClick={confirmRemoveContact}>Remover</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        
      </div>
      <Toaster />
    </div>
  )
}
