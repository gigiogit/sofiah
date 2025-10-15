import { Suspense } from 'react'
import SuccessContent from './SuccessContent'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuccessPage() {
  return (
    <div className="container mx-auto max-w-4xl w-full px-4 sm:px-0">
      <Suspense fallback={<LoadingCard />}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}

function LoadingCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-[var(--primary-color)] text-white">
        <CardTitle>Processando seu pagamento</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-center text-lg">Por favor, aguarde enquanto confirmamos seu pagamento...</p>
      </CardContent>
    </Card>
  )
}

