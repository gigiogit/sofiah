'use client'

import { EventType } from '@/app/data/calendar'
import { Event } from '@/app/data/calendar'
import { useState, useEffect, useCallback } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Contact } from '@/app/data/contact'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, Save, Copy, CalendarX, Video } from 'lucide-react'
import { cn } from "@/lib/utils"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/context/AuthContext'
import { Popover, PopoverContent, PopoverTrigger } from"@/components/ui/popover"
import { SearchContact } from '@/components/SearchContact'
import { Input } from "@/components/ui/input"
import React from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type EventsByMonth = Record<string, Record<string, Event[]>>;

const CustomSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { occupiedSlots?: boolean[] }
>(({ className, occupiedSlots, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--complementary-color)]">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--primary-color)]" />
      {occupiedSlots && occupiedSlots.map((isOccupied, index) => (
        isOccupied && (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-1 bg-gray-800"
            style={{ left: `${(index / 47) * 100}%` }}
          />
        )
      ))}
    </SliderPrimitive.Track>
    {props.value?.map((_, index) => (
      <SliderPrimitive.Thumb
        key={index}
        className="block h-5 w-5 rounded-full border-2 border-[var(--primary-color)] bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
    ))}
  </SliderPrimitive.Root>
))
CustomSlider.displayName = SliderPrimitive.Root.displayName

const getOccupiedTimeSlots = (date: Date | undefined, events: EventsByMonth): boolean[] => {
  if (!date) return Array(48).fill(false);
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthKey = format(date, 'yyyy-MM');
  const dayEvents = events[monthKey]?.[dateStr] || [];
  const occupiedSlots = Array(48).fill(false);

  dayEvents.forEach((event: Event) => {
    const startSlot = timeToSlot(event.start_time);
    occupiedSlots[startSlot] = true;
  });

  return occupiedSlots;
};

const timeToSlot = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 2 + (minutes >= 30 ? 1 : 0);
};

const formatSliderTime = (value: number, isStart: boolean) => {
  if (value === 48) return '24:00'
  const hours = Math.floor(value / 2)
  const minutes = (value % 2) * 30
  if (isStart) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } else {
    return `${(((hours * 60 + minutes - 1 + 1440) / 60 | 0) % 24).toString().padStart(2, '0')}:${((minutes - 1 + 60) % 60).toString().padStart(2, '0')}`;
  }
}

const isTimeSlotOccupied = (startTime: number, endTime: number, date: Date | undefined, events: EventsByMonth) => {
  if (!date) return false;
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthKey = format(date, 'yyyy-MM');
  const existingEvents = events[monthKey]?.[dateStr] || [];
  const startSlotTime = formatSliderTime(startTime, true);
  const endSlotTime = formatSliderTime(endTime, false);
  return existingEvents.some(event => 
    !(event.end_time < startSlotTime || event.start_time > endSlotTime)
  );
};

const sortAndGroupEvents = (events: Event[]): Event[] => {
  const sortedEvents = events.sort((a, b) => {
    const timeA = a.start_time.split(':').map(Number);
    const timeB = b.start_time.split(':').map(Number);
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
  });

  const subOneMinute = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() - 1);
    const updatedHours = String(date.getHours()).padStart(2, '0');
    const updatedMinutes = String(date.getMinutes()).padStart(2, '0');
    return `${updatedHours}:${updatedMinutes}`;
  };

  const groupedEvents: Event[] = [];
  let currentGroup: Event[] = [];

  sortedEvents.forEach((event) => {
    if (event.calendar_type === 'Bloqueado') {
      if (currentGroup.length === 0 || subOneMinute(event.start_time) === currentGroup[currentGroup.length - 1].end_time) {
        currentGroup.push(event);
      } else {
        if (currentGroup.length > 0) {
          groupedEvents.push({
            ...currentGroup[0],
            end_time: currentGroup[currentGroup.length - 1].end_time,
            groupedEvents: currentGroup
          } as Event);
          currentGroup = [];
        }
        currentGroup.push(event);
      }
    } else {
      if (currentGroup.length > 0) {
        groupedEvents.push({
          ...currentGroup[0],
          end_time: currentGroup[currentGroup.length - 1].end_time,
          groupedEvents: currentGroup
        } as Event);
        currentGroup = [];
      }
      groupedEvents.push(event);
    }
  });

  if (currentGroup.length > 0) {
    groupedEvents.push({
      ...currentGroup[0],
      end_time: currentGroup[currentGroup.length - 1].end_time,
      groupedEvents: currentGroup
    } as Event);
  }

  return groupedEvents;
};

export default function CalendarApp() {
  const { provAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<number>(0)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<EventsByMonth>({})
  const [eventType, setEventType] = useState<EventType>('Sessão Remota')
  const [description, setDescription] = useState("")
  const [selectedTime, setSelectedTime] = useState<number>(0)
  const [blockedHours, setBlockedHours] = useState<[number, number]>([0, 48])
  const [repeatWeeks, setRepeatWeeks] = useState<number>(0)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [copyFromDate, setCopyFromDate] = useState<Date | undefined>(new Date())
  const [copyToDate, setCopyToDate] = useState<Date | undefined>(new Date())
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyToOpen, setCopyToOpen] = useState(false);
  const [complement, setComplement] = useState("")
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToCancel, setEventToCancel] = useState<Event | null>(null);
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

  const fetchEventsForMonth = useCallback(async (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthKey = format(start, 'yyyy-MM');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/range/${format(start, 'yyyy-MM-dd')}/${format(end, 'yyyy-MM-dd')}/${provAuthenticated}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const fetchedEvents: Event[] = await response.json();
      
      const eventsByDate: Record<string, Event[]> = {};
      fetchedEvents.forEach(event => {
        if (!eventsByDate[event.calendar_date]) {
          eventsByDate[event.calendar_date] = [];
        }
        eventsByDate[event.calendar_date].push(event);
      });

      setEvents(prevEvents => ({
        ...prevEvents,
        [monthKey]: eventsByDate
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar eventos. Por favor, tente novamente!",
        duration: 3000,
      });
    }
  }, [setEvents, provAuthenticated, toast]);

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
    fetchEventsForMonth(currentMonth);
    fetchContacts();
  }, [currentMonth, fetchEventsForMonth, fetchContacts]);

  const saveEvents = async (eventType: string, eventStart: string, eventEnd: string, eventDescription: string, dateToSave: Date, idUser: number, status: number) => {
    const dateStr = format(dateToSave, 'yyyy-MM-dd')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendar_type: eventType,
          start_time: eventStart,
          end_time: eventEnd,
          description: eventDescription,
          calendar_date: dateStr,
          id_provider: provAuthenticated.toString(),
          id_user: idUser.toString(),
          status: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event')
      }

    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar o evento. Por favor, tente novamente!",
        duration: 3000,
      });
      return
    }
  };

  const handleCopyAgenda = async () => {
    if (!copyFromDate || !copyToDate || !date) return
    if (copyFromDate > copyToDate) {
      toast({
        variant: "destructive",
        title: "Erro de Data",
        description: "A data 'De' deve ser menor que a data 'Até'.",
        duration: 3000,
      });
      return;
    }
    if (copyToDate >= date) {
      toast({
        variant: "destructive",
        title: "Erro de Data",
        description: "A data 'Até' deve ser menor que a data de referência.",
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

    const iDate = new Date(copyFromDate)
    const dateToSave = new Date(date)
    while (iDate <= copyToDate) {
      const sourceDateStr = format(iDate, "yyyy-MM-dd")
      const sourceMonthKey = format(iDate, "yyyy-MM")
      const destinationDateStr = format(dateToSave, "yyyy-MM-dd")
      const dayEvents = events[sourceMonthKey]?.[sourceDateStr] || []
  
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/calendar/deleteday/${provAuthenticated}/${destinationDateStr}`,
          { method: 'DELETE' }
        )
        if (!response.ok) {
          throw new Error('Failed to delete event')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
      }
  
      if (dayEvents.length !== 0) {
        for (const event of dayEvents) {
          await saveEvents(
            event.calendar_type,
            event.start_time,
            event.end_time,
            event.description,
            new Date(dateToSave),
            event.id_user,
            event.status
          );
        }
      }
  
      iDate.setDate(iDate.getDate() + 1)
      dateToSave.setDate(dateToSave.getDate() + 1)
    }
  
    await fetchEventsForMonth(currentMonth);

    toast({
      variant: "default",
      title: "Sucesso",
      description: "A agenda foi copiada!",
      duration: 3000,
    })
  }

  const handleSaveEvent = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Alerta",
        description: "Favor informar a data!",
        duration: 3000,
      })
      return
    }

    if (eventType !== 'Bloqueado' && !description.trim()) {
      toast({
        variant: "destructive",
        title: "Alerta",
        description: "Favor informar o nome do paciente!",
        duration: 3000,
      })
      return
    }

    if (eventType === 'Sessão Remota' || eventType === 'Sessão Presencial') {
      const startTime = selectedTime;
      const endTime = selectedTime + 2;

      if (isTimeSlotOccupied(startTime, endTime, date, events)) {
        toast({
          variant: "destructive",
          title: "Alerta",
          description: "Este horário já está ocupado por outro evento!",
          duration: 3000,
        })
        return
      }

    for (let i = 0; i <= repeatWeeks; i++) {
      const sessionDate = new Date(date);
      sessionDate.setDate(sessionDate.getDate() + i * 7);

      await saveEvents(
        eventType,
        `${formatSliderTime(startTime, true)}:00`,
        `${formatSliderTime(endTime, false)}:00`,
        `Paciente: ${description} / Telefone: ${contacts.find(contact => Number(contact.id) === selectedContact)?.phone}\n${complement}`,
        sessionDate,
        selectedContact,
        0)
      };

    } else {
      const [startSlot, endSlot] = blockedHours;
      for (let slot = startSlot; slot < endSlot; slot++) {
        const startTime = slot;
        const endTime = slot + 1;
        
        await saveEvents(
          eventType,
          `${formatSliderTime(startTime, true)}:00`,
          `${formatSliderTime(endTime, false)}:00`,
          "Bloqueio",
          date,
          0,
          0)
      }
    }
    
    await fetchEventsForMonth(currentMonth);

    setEventType('Sessão Remota')
    setSelectedTime(0)
    setBlockedHours([0, 48])
    
    toast({
      variant: "default",
      title: "Sucesso",
      description: "O evento foi salvo!",
      duration: 3000,
    })
  }

  const handleCancelEvent = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: 2
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change status event')
      }

      await fetchEventsForMonth(currentMonth);
    } catch (error) {
      console.error('Error change status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao alterar o status. Por favor, tente novamente!",
        duration: 3000,
      });
      return
    }
  }

  const handleDeleteOneEvent = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/deleteone/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEventsForMonth(currentMonth);

      toast({
        variant: "default",
        title: "Sucesso",
        description: "O evento foi excluído!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o evento. Por favor, tente novamente.",
        duration: 3000,
      });
    }
  }

  const handleDeleteGroupEvent = async (dateStr: string, startTime: string, endTime: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/deletegroup/${dateStr}/${startTime}/${endTime}/${provAuthenticated}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEventsForMonth(currentMonth);

      toast({
        variant: "default",
        title: "Sucesso",
        description: "O evento foi excluído!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o evento. Por favor, tente novamente.",
        duration: 3000,
      });
    }
  }

  const handleStartMeet = async (idUser: number, idCalendar: number) => {
    try {
      // Primeiro verifica se já existe uma reunião para este calendário
      console.log('Verificando se já existe reunião...');
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/calendar/${idCalendar}`);
      
      if (checkResponse.ok) {
        const existingMeeting = await checkResponse.json();
        if (existingMeeting && existingMeeting.meeting_id) {
          console.log('Reunião existente encontrada, redirecionando...');
          router.replace(`/meet/${existingMeeting.meeting_id}`);
          return;
        }
      }
      
      // Se não existe reunião, cria uma nova
      console.log('Criando nova reunião via API...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: provAuthenticated, userId: idUser, calendarId: idCalendar }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao criar reunião.');
      router.replace(`/meet/${data.meeting_id}`);
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao iniciar aula remota. Por favor, tente novamente.",
        duration: 3000,
      });
    }
  }

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
    
  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-0' : 'pt-4 space-y-4'} flex justify-center items-center`}>
      <div className={`w-full ${isMobile ? '' : 'sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]'}`}>
        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Calendário</CardTitle>
            <CardDescription className="text-gray-200">
              Selecione a data para verificar ou adicionar eventos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-4 pt-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                month={currentMonth}
                showOutsideDays={true}
                className="rounded-md border-[var(--primary-color)] shadow-sm"
                classNames={{
                  day_today: "text-[var(--primary-color)]",
                  day_selected: "bg-[var(--primary-color)] text-white",
                  day_outside: "text-gray-400 opacity-50",
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div className="w-full h-full flex flex-col justify-between items-center p-1">
                      <span className={cn(
                        !isSameMonth(date, currentMonth) && "text-gray-400 opacity-50"
                      )}>
                        {format(date, 'd')}
                      </span>
                      {events[format(date, 'yyyy-MM')]?.[format(date, 'yyyy-MM-dd')]?.some(event => event.calendar_type !== 'Bloqueado') && (
                        <div className="w-1.5 h-1.5 bg-[#FF1493] rounded-full" />
                      )}
                    </div>
                  ),
                }}
                onMonthChange={(newMonth) => {
                  setCurrentMonth(newMonth);
                  setDate(startOfMonth(newMonth));
                  fetchEventsForMonth(newMonth);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Adicionar Evento</CardTitle>
            <CardDescription className="text-gray-200">
              Preencha sua agenda do dia {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '*Selecione uma data*'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="font-medium text-gray-600">Tipo de Evento:</div>
              <RadioGroup value={eventType} onValueChange={(value) => setEventType(value as EventType)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sessão Remota" id="sessão remota" />
                  <Label htmlFor="sessão remota" className="text-gray-600">Sessão Remota</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sessão Presencial" id="sessão presencial" />
                  <Label htmlFor="sessão presencial" className="text-gray-600">Sessão Presencial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bloqueado" id="bloqueado" />
                  <Label htmlFor="bloqueado" className="text-gray-600">Bloqueado</Label>
                </div>
              </RadioGroup>
            </div>
            <br />

            {eventType === 'Sessão Remota' || eventType === 'Sessão Presencial' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base text-gray-600">Horário da sessão:</Label>
                  <div className="relative mt-2">
                    <CustomSlider
                      min={0}
                      max={47}
                      step={1}
                      value={[selectedTime]}
                      onValueChange={(value) => {
                        setSelectedTime(value[0]);
                        if (isTimeSlotOccupied(value[0], value[0] + 2, date, events)) {
                          toast({
                            variant: "destructive",
                            title: "Alerta",
                            description: "Este horário já está ocupado por outro evento!",
                            duration: 3000,
                          });
                        }
                      }}
                      className="mt-2"
                      occupiedSlots={getOccupiedTimeSlots(date, events)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--primary-color)]">
                    <span>00:00</span>
                    <span>{formatSliderTime(selectedTime, true)} - {formatSliderTime(selectedTime + 2, false)}</span>
                    <span>23:30</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base text-gray-600">Horário de bloqueio:</Label>
                  <CustomSlider
                    min={0}
                    max={48}
                    step={1}
                    value={blockedHours}
                    onValueChange={(value: number[]) => setBlockedHours(value as [number, number])}
                    className="mt-2"
                    occupiedSlots={getOccupiedTimeSlots(date, events)}
                  />
                  <div className="flex justify-between text-sm text-[var(--primary-color)]">
                    <span>{formatSliderTime(blockedHours[0], true)}</span>
                    <span>{formatSliderTime(blockedHours[1], false)}</span>
                  </div>
                </div>
              </div>
            )}
            <br />

            {eventType !== 'Bloqueado' && (
              <div className="space-y-2">
                <div className="font-medium text-gray-600">Paciente</div>
                <SearchContact 
                  suggestions={contacts}
                  onSelect={(contact) => {
                    setSelectedContact(Number(contact.id));
                    setDescription(contact.name);
                  }}
                />
                <br />
              </div>
            )}

            <div className="space-y-2">
              <div className="font-medium text-gray-600">Complemento</div>
              <Input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                required
                className="w-full"
              />
              <br />
            </div>

            {eventType === 'Sessão Remota' || eventType === 'Sessão Presencial' ? (
              <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base text-gray-600">Repetir a sessão por mais quantas semanas?</Label>
                  <CustomSlider
                    min={0}
                    max={3}
                    step={1}
                    value={[repeatWeeks]}
                    onValueChange={(value) => {
                      setRepeatWeeks(value[0])
                    } }
                    className="mt-2" />
                </div>
                <div className="flex justify-between text-sm text-[var(--primary-color)]">
                  <span>0</span>
                  <span>{repeatWeeks}</span>
                  <span>3</span>
                </div>
              </div>
              <br />
              </>
            ) : null}

            <Button 
              onClick={handleSaveEvent}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white">
              <Save className="mr-2 h-4 w-4" /> Salvar Evento
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Copiar Agenda</CardTitle>
            <CardDescription className="text-gray-200">
              A cópia da agenda entre as datas informadas, será publicada a partir de {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '*Selecione uma data*'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
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
                          <span>Informar Data</span>
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
                          <span>Informar Data</span>
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
            <br />
            <Button
              onClick={handleCopyAgenda}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Agenda
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Eventos do Dia</CardTitle>
            <CardDescription className="text-gray-200">
              {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '*Selecione uma data*'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {date && events[format(date, 'yyyy-MM')]?.[format(date, 'yyyy-MM-dd')] ? (
                <div className="space-y-2">
                  {sortAndGroupEvents(events[format(date, 'yyyy-MM')][format(date, 'yyyy-MM-dd')]).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:bg-[var(--secondary-color)] transition-colors"
                    >
                      <div>
                        <div className="font-medium text-[var(--primary-color)]">
                          {event.calendar_type} {event.calendar_type !== 'Bloqueado' ?
                            (event.status === 0
                              ? ' / Agendado'
                              : event.status === 1
                                ? ' / Realizado'
                                : event.status === 2
                                  ? ' / Cancelado'
                                  : event.status
                            ) : null
                          }
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Horário de início: {event.start_time}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Horário de fim: {event.end_time}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{event.description}</div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        { event.calendar_type !== 'Bloqueado' ? (
                          <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {handleStartMeet(event.id_user, event.id)}}
                            className="text-green-600 hover:text-green-800 hover:bg-gray-300"
                            title="Iniciar vídeo da sessão."
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEventToCancel(event);
                              setIsConfirmCancelOpen(true);}}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-gray-300"
                            title="Cancelar a sessão."
                          >
                            <CalendarX className="h-4 w-4" />
                          </Button>
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEventToDelete(event);
                            setIsConfirmDeleteOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-gray-300"
                          title="Remover esse evento da agenda."
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))} 
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {date 
                    ? "Nenhum evento cadastrado para esta data" 
                    : "Selecione uma data para ver os eventos"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-gray-900">Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o evento?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Fechar</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    eventToDelete &&
                    (eventToDelete.calendar_type === 'Sessão Remota' || eventToDelete.calendar_type === 'Sessão Presencial')
                  ) {
                    handleDeleteOneEvent(eventToDelete.id);
                  } else if (eventToDelete) {
                    handleDeleteGroupEvent(
                      format(date ?? new Date(), 'yyyy-MM-dd'),
                      eventToDelete.start_time,
                      eventToDelete.end_time
                    );
                  }
                  setIsConfirmDeleteOpen(false);
                }}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        

        <Dialog open={isConfirmCancelOpen} onOpenChange={setIsConfirmCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-gray-900">Confirmar cancelamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar a sessão?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmCancelOpen(false)}>Fechar</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (eventToCancel) {
                    handleCancelEvent(eventToCancel.id)
                  }
                  setIsConfirmCancelOpen(false);
                }}
              >
                Cancelar Sessão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        
      </div>
      <Toaster />
    </div>
  )
}
