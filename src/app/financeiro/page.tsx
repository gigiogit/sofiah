'use client'

import { useState, useEffect, useCallback } from "react"
import AddRecordForm from "./AddRecordForm"
import RecordList from "./RecordList"
import DateFilter from "./DateFilter"
import { useAuth } from '@/context/AuthContext'
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import Link from 'next/link'

export type Record = {
  id: number
  payment_date: Date | string
  payment_value: number
  payment_type_name: string
  user_name: string
  status: number
}

export default function FinancialRecords() {
  const { provAuthenticated, isReady } = useAuth();
  const [records, setRecords] = useState<Record[]>([])
  const [copyFromDate, setCopyFromDate] = useState<Date | undefined>(new Date())
  const [copyToDate, setCopyToDate] = useState<Date | undefined>(new Date())
  const [client, setClient] = useState("")
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

  const filterRecords = useCallback(async (client: string, startDate: Date, endDate: Date) => {
    setClient(client)
    setCopyFromDate(startDate)
    setCopyToDate(endDate)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/range/${client || 'vazio'}/${format(startDate, 'yyyy-MM-dd')}/${format(endDate, 'yyyy-MM-dd')}/${provAuthenticated}`);
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      const fetchedPayments: Record[] = await response.json();
      setRecords(fetchedPayments)
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar pagamentos. Por favor, tente novamente!",
        duration: 3000,
      });
    }
  }, [provAuthenticated, toast]);

  useEffect(() => {
    const today = new Date()
    filterRecords(client, today, today)
  }, [filterRecords, client])

  const addRecord = (record: Record) => {
    setRecords([...records, record])
  }

  const deleteRecord = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/deleteone/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      filterRecords(client || '', copyFromDate || new Date(), copyToDate || new Date())
      toast({
        variant: "default",
        title: "Sucesso",
        description: "O recebimento foi excluído!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o recebimento. Por favor, tente novamente.",
        duration: 3000,
      });
    }
  }

  const paidRecord = async (id: number, status: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: (status === 0) ? 1 : 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change status event')
      }
      filterRecords(client || '', copyFromDate || new Date(), copyToDate || new Date())
      toast({
        variant: "default",
        title: "Sucesso",
        description: "O pagamento foi atualizado!",
        duration: 3000,
      });

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

  if (provAuthenticated === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-[var(--primary-color)]">Você precisa estar autenticado para acessar esta página.</p>
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
        <p className="text-lg text-[var(--primary-color)]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-0' : 'pt-4 space-y-4'} flex justify-center items-center`}>
      <div className={`w-full ${isMobile ? '' : 'sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]'}`}>
        <AddRecordForm onAddRecord={addRecord} />
        <DateFilter onFilter={filterRecords} />
        <RecordList records={records} onDeleteRecord={deleteRecord} onTogglePaid={paidRecord} />
      </div>
    </div>
  )
}

