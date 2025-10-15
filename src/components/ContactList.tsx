import { Contact } from '@/app/data/contact'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  selectedContactName: string | null;
  onSelectContact: (contactId: string, contactName: string) => void;
  onRemoveContact: (contactId: string) => void;
}

export function ContactList({ contacts, selectedContactId, onSelectContact, onRemoveContact }: ContactListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <Card className="mb-4 bg-white shadow-[12px]">
      <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px]">
        <CardTitle>Pacientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 
                ${selectedContactId === contact.id ? 'bg-[var(--secondary-color)]' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-grow"
                  onClick={() => onSelectContact(contact.id, contact.name)}
                >
                  <div className="font-medium text-[var(--primary-color)]">{contact.name}</div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <div>{contact.phone}</div>
                    <div>{contact.birthday ? format(new Date(contact.birthday), 'dd/MM/yyyy') : ''}</div>
                    <div>{contact.gender ? contact.gender : ''}</div>
                  </div>                  
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveContact(contact.id);
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-gray-300"
                    title="Remover o paciente de seus contatos."
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === contact.id ? null : contact.id);
                    }}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-300"
                    title={expandedId !== contact.id ? "Visualizar anamnese do paciente." : "Ocultar anamnese do paciente."}
                  >
                    {expandedId === contact.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {expandedId === contact.id && (
                <div className="mt-2 pl-4 text-sm text-gray-600 max-h-48 whitespace-pre-wrap overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <strong>Anamnese:</strong>
                  <br />
                  {contact.anamnesis}
                  <br />
                  <br />
                  <strong>Análise:</strong>
                  <br />
                  {contact.anamnesis_analysis}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

