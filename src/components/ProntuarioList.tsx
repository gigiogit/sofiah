import { Prontuario } from '@/app/data/prontuario'
import { ProntuarioCard } from './ProntuarioCard'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered } from 'lucide-react'

interface ProntuarioListProps {
  prontuario: Prontuario[];
  fetchProntuario: () => void;
}

export function ProntuarioList({ prontuario, fetchProntuario }: ProntuarioListProps) {
  const prontuarioEndRef = useRef<HTMLDivElement>(null)
  const [editingProntuario, setEditingProntuario] = useState<Prontuario | null>(null)
  const [editedText, setEditedText] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  // Função para salvar a posição do cursor
  const saveCaretPosition = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0)
    }
    return null
  }

  // Função para restaurar a posição do cursor
  const restoreCaretPosition = (range: Range) => {
    const selection = window.getSelection()
    if (selection && range) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  const scrollToBottom = () => {
    prontuarioEndRef.current?.scrollIntoView({ behavior: "auto" })
  }

  useEffect(() => {
    if (prontuario.length > 0) {
      scrollToBottom()
    }
  }, [prontuario])

  // Garantir que o conteúdo seja carregado quando o dialog abrir
  useEffect(() => {
    if (editingProntuario && editorRef.current) {
      // Aguardar um pouco para o DOM estar pronto
      const timer = setTimeout(() => {
        if (editorRef.current) {
          // Processar o conteúdo para garantir quebras de linha adequadas
          let content = editingProntuario.prontuario || ''
          // Se não há tags HTML, converter quebras de linha em <br>
          if (!content.includes('<') && content.includes('\n')) {
            content = content.replace(/\n/g, '<br>')
          }
          editorRef.current.innerHTML = content
          setEditedText(content)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [editingProntuario])

  const handleEdit = (item: Prontuario) => {
    setEditingProntuario(item)
    setEditedText(item.prontuario || '') // Adicionar fallback para string vazia
    
    // Garantir que o conteúdo seja definido após o dialog renderizar
    setTimeout(() => {
      if (editorRef.current) {
        // Processar o conteúdo para garantir quebras de linha adequadas
        let content = item.prontuario || '' // Adicionar verificação de segurança
        // Se não há tags HTML, converter quebras de linha em <br>
        if (!content.includes('<') && content.includes('\n')) {
          content = content.replace(/\n/g, '<br>')
        }
        editorRef.current.innerHTML = content
        editorRef.current.focus()
      }
    }, 50)
  }

  const applyFormat = (command: string, value?: string) => {
    // Garantir que o editor tenha foco antes de aplicar formatação
    if (editorRef.current) {
      editorRef.current.focus()
      
      // Salvar posição do cursor antes da formatação
      const range = saveCaretPosition()
      
      // Aplicar formatação
      document.execCommand(command, false, value)
      
      // Restaurar posição do cursor se necessário
      if (range) {
        setTimeout(() => restoreCaretPosition(range), 10)
      }
      
      // Atualizar o estado após a formatação
      const content = editorRef.current.innerHTML
      setEditedText(content)
    }
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // Só atualizar o estado se o conteúdo realmente mudou
      if (content !== editedText) {
        setEditedText(content)
      }
    }
  }

  const handleSaveProntuario = async (id: number | undefined, novoProntuario: string) => {
    setEditingProntuario(null)
    if (!id) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/prontuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          prontuario: novoProntuario,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event')
      }

      fetchProntuario();
    } catch (error) {
      console.error('Error fetching prontuario:', error);
      return
    }
  }

  return (
    <div className="flex flex-col space-y-2 p-0 h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {prontuario.map((item) => (
        <ProntuarioCard
          key={item.id}
          prontuario={item}
          onEdit={() => handleEdit(item)}
        />
      ))}
      <div ref={prontuarioEndRef} />

      {/* Editor de texto profissional */}
      <Dialog open={!!editingProntuario} onOpenChange={open => !open && setEditingProntuario(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogTitle className="text-black mb-4">Editar Prontuário</DialogTitle>
          
          {/* Barra de ferramentas */}
          <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            {/* Seletor de fonte */}
            <Select onValueChange={(value) => applyFormat('fontName', value)}>
              <SelectTrigger className="w-32 text-black border-black">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>

            {/* Seletor de tamanho */}
            <Select onValueChange={(value) => applyFormat('fontSize', value)}>
              <SelectTrigger className="w-16 text-black border-black">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">8pt</SelectItem>
                <SelectItem value="2">10pt</SelectItem>
                <SelectItem value="3">12pt</SelectItem>
                <SelectItem value="4">14pt</SelectItem>
                <SelectItem value="5">18pt</SelectItem>
                <SelectItem value="6">24pt</SelectItem>
                <SelectItem value="7">36pt</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Botões de formatação */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('bold')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('italic')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('underline')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Sublinhado"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Botões de alinhamento */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('justifyLeft')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('justifyCenter')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Centralizar"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('justifyRight')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Alinhar à direita"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('justifyFull')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Justificar"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Botões de lista */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('insertUnorderedList')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Lista com marcadores"
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFormat('insertOrderedList')}
              className="p-2 text-black border-black hover:bg-black hover:text-white"
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

          </div>

          {/* Área do editor */}
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onFocus={() => {
              // Garantir que o conteúdo esteja presente quando o editor receber foco
              if (editorRef.current && !editorRef.current.innerHTML && editingProntuario) {
                editorRef.current.innerHTML = editingProntuario.prontuario
              }
            }}
            className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 border border-gray-300 rounded-lg bg-white prontuario-html-content focus:outline-none focus:ring-2 focus:ring-black"
            style={{
              fontSize: '12px',
              lineHeight: '1.5',
              fontFamily: 'Arial, sans-serif',
              wordBreak: 'break-word',
              color: 'black',
              whiteSpace: 'pre-wrap'
            }}
            suppressContentEditableWarning={true}
          />

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              className="text-black border-black hover:bg-gray-100" 
              variant="outline" 
              onClick={() => setEditingProntuario(null)}
            >
              Fechar
            </Button>
            <Button 
              className="text-white bg-black hover:bg-gray-800" 
              onClick={() => handleSaveProntuario(editingProntuario?.id ? Number(editingProntuario.id) : undefined, editedText)}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>      
    </div>
  )
}