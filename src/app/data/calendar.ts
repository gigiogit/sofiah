export type EventType = 'Sessão Remota' | 'Sessão Presencial' | 'Bloqueado'

export type Event = {
  id: number;
  calendar_type: EventType;
  start_time: string;
  end_time: string;
  description: string;
  calendar_date: string;
  id_user: number;
  status: number;
  groupedEvents?: Event[];
}
