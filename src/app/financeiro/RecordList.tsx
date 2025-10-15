import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { CheckCircle2, Circle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Record } from "./page"

type RecordListProps = {
  records: Record[]
  onDeleteRecord: (id: number) => void
  onTogglePaid: (id: number, status: number) => void
}

export default function RecordList({ records, onDeleteRecord, onTogglePaid }: RecordListProps) {
  const totalAmount = records.reduce((sum, record) => sum + record.payment_value, 0)
  const totalPaidAmount = records
    .filter(record => record.status === 1)
    .reduce((sum, record) => sum + record.payment_value, 0)  

  return (
    <Card className="mb-4 bg-white shadow-[12px] relative">
      <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
        <CardTitle>Histórico de Recebimentos</CardTitle>
        <CardDescription className="text-gray-200">
          Recebimentos realizados no período
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-12 text-center">Del</TableHead>
              <TableHead className="w-12 text-center">Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{format(parseISO(record.payment_date.toString()), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell className="text-right">
                  {record.payment_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>{record.payment_type_name}</TableCell>
                <TableCell>{record.user_name}</TableCell>
                <TableCell className="w-12 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteRecord(record.id)}
                    aria-label="Excluir registro"
                    className="text-red-600 hover:text-red-800 hover:bg-gray-300"
                    title="Remover recebimento" >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="w-12 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={record.status ? "Marcar como não pago" : "Marcar como pago"}
                    className={record.status ? "text-green-600 hover:text-green-800 hover:bg-gray-300" : "text-gray-400 hover:text-green-600 hover:bg-gray-300"}
                    onClick={() => onTogglePaid(record.id, record.status)}
                    title={record.status ? "Marcar como não pago" : "Marcar como pago"}
                  >
                    {record.status ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-lg font-bold text-right">
          Total de Recebimentos: {totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        <div className="mt-4 text-lg font-bold text-right">
          Total de Recebimentos Pagos: {totalPaidAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </CardContent>
    </Card>
  )
}

