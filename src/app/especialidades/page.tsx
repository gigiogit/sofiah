'use client'

import { useState } from 'react';
import { activities, type Activity } from '../data/activities';
import { CatProvider01, type Provider01Cat } from '../data/catProvider01';
import { CatProvider02, type Provider02Cat } from '../data/catProvider02';
import { CatProvider03, type Provider03Cat } from '../data/catProvider03';
import { CatProvider04, type Provider04Cat } from '../data/catProvider04';
import { CatProvider05, type Provider05Cat } from '../data/catProvider05';
import { CatProvider06, type Provider06Cat } from '../data/catProvider06';
import { ActivitySelector } from '@/components/ActivitySelector';
import { SearchInput } from '@/components/SearchInput';
import { SelectedProvider01 } from '@/components/SelectedProvider01';
import { SelectedProvider02 } from '@/components/SelectedProvider02';
import { SelectedProvider03 } from '@/components/SelectedProvider03';
import { SelectedProvider04 } from '@/components/SelectedProvider04';
import { SelectedProvider05 } from '@/components/SelectedProvider05';
import { SelectedProvider06 } from '@/components/SelectedProvider06';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link';

export default function EspecialidadeApp() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { provAuthenticated, isReady } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedProvider01, setSelectedProvider01] = useState<Provider01Cat[]>([]);
  const [selectedProvider02, setSelectedProvider02] = useState<Provider02Cat[]>([]);
  const [selectedProvider03, setSelectedProvider03] = useState<Provider03Cat[]>([]);
  const [selectedProvider04, setSelectedProvider04] = useState<Provider04Cat[]>([]);
  const [selectedProvider05, setSelectedProvider05] = useState<Provider05Cat[]>([]);
  const [selectedProvider06, setSelectedProvider06] = useState<Provider06Cat[]>([]);
  const { toast } = useToast()

  interface Modality {
    id: string;
    id_provider: number;
    id_modality: string;
    description_modality: string;
    id_category: string;
    description_category: string;
  }

  const addModality = async (modalityId: string, modalityName: string): Promise<Modality | null> => {
      try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modality/addmodality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_provider: provAuthenticated,
          id_modality: modalityId,
          description_modality: modalityName,
          id_category: selectedActivity?.id,
          description_category: selectedActivity?.name
          }),
        });

      if (!response.ok) {
        throw new Error('Failed to save Modality');
      }

      const savedModality: Modality = await response.json();
      setRefreshKey(prev => prev + 1);
      return savedModality;
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha: Erro no cadastro da modalidade.",
      });
      return null;
    }
  }

  const deleteModality = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modality/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete modality');
      }
      setRefreshKey(prev => prev + 1);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao remover modalidade.",
      });
    }
  };

  const fetchModality = async (id_category: string): Promise<Modality | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modality/${provAuthenticated}/${id_category}`)
      if (!response.ok) throw new Error('Failed to fetch modalities')
      if (response.status === 204) {
        return null;
      }
      const loadedModality: Modality = await response.json();
      return loadedModality;
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar mensagens. Por favor, tente novamente.",
      })
    }
    return null;
  }

  const handleActivitySelect = async (activity: Activity) => {
    if (activity.id !== selectedActivity?.id) {
      setSelectedActivity(activity);
      setSelectedProvider01([]);
      setSelectedProvider02([]);
      setSelectedProvider03([]);
      setSelectedProvider04([]);
      setSelectedProvider05([]);
      setSelectedProvider06([]);

      const savedModality = await fetchModality(activity.id);
      if (savedModality && Array.isArray(savedModality)) {
        const mappedModalities = savedModality.map(modality => ({
          id: modality.id_modality,
          name: modality.description_modality,
          sequenceId: modality.id
        }));
        
        switch (activity.id) {
          case 'A':
            setSelectedProvider01(mappedModalities);
            break;
          case 'B':
            setSelectedProvider02(mappedModalities);
            break;
          case 'C':
            setSelectedProvider03(mappedModalities);
            break;
          case 'D':
            setSelectedProvider04(mappedModalities);
            break;
          case 'E':
            setSelectedProvider05(mappedModalities);
            break;
          case 'F':
            setSelectedProvider06(mappedModalities);
            break;
        }
      }
    }
  }

  const handleSelectProvider01 = async (art: Provider01Cat) => {
    if (!selectedProvider01.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider01([...selectedProvider01, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }
  
  const handleRemoveProvider01 = async (art: Provider01Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider01(selectedProvider01.filter(selected => selected.id !== art.id));
    }
  }

  const handleSelectProvider02 = async (art: Provider02Cat) => {
    if (!selectedProvider02.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider02([...selectedProvider02, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }

  const handleRemoveProvider02 = async (art: Provider02Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider02(selectedProvider02.filter(selected => selected.id !== art.id));
    }
  }

  const handleSelectProvider03 = async (art: Provider03Cat) => {
    if (!selectedProvider03.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider03([...selectedProvider03, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }

  const handleRemoveProvider03 = async (art: Provider03Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider03(selectedProvider03.filter(selected => selected.id !== art.id));
    }
  }

  const handleSelectProvider04 = async (art: Provider04Cat) => {
    if (!selectedProvider04.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider04([...selectedProvider04, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }

  const handleRemoveProvider04 = async (art: Provider04Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider04(selectedProvider04.filter(selected => selected.id !== art.id));
    }
  }

  const handleSelectProvider05 = async (art: Provider05Cat) => {
    if (!selectedProvider05.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider05([...selectedProvider05, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }

  const handleRemoveProvider05 = async (art: Provider05Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider05(selectedProvider05.filter(selected => selected.id !== art.id));
    }
  }

  const handleSelectProvider06 = async (art: Provider06Cat) => {
    if (!selectedProvider06.some(selected => selected.id === art.id)) {
      const savedModality = await addModality(art.id, art.name);
      if (savedModality) {
        setSelectedProvider06([...selectedProvider06, {
          ...art,
          sequenceId: savedModality.id
        }]);
      }
    }
  }

  const handleRemoveProvider06 = async (art: Provider06Cat) => {
    if (art.sequenceId) {
      await deleteModality(art.sequenceId);
      setSelectedProvider06(selectedProvider06.filter(selected => selected.id !== art.id));
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
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] pt-4 space-y-4 flex justify-center items-center">
      <div className="w-full sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]">
        <Card className="mb-4 bg-white shadow-[12px]">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px]">
            <CardTitle>Escolha suas Especialidades</CardTitle>
            <CardDescription className="text-gray-200">
              Elas servirão para que os pacientes possam te encontrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profissionais:</h2>
                <ActivitySelector 
                    activities={activities}
                    selectedActivity={selectedActivity}
                    onSelect={handleActivitySelect}
                    refreshKey={refreshKey}
                />
                </div>

                {selectedActivity?.id === 'A' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades na Psicologia:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider01} 
                    onSelect={handleSelectProvider01} 
                    />
                    
                    {selectedProvider01.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider01.map(art => (
                        <SelectedProvider01 
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider01} 
                        />
                        ))}
                    </div>
                    )}
                </div>
                )}

                {selectedActivity?.id === 'B' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades na Psiquiatria:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider02} 
                    onSelect={handleSelectProvider02} 
                    />
                    
                    {selectedProvider02.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider02.map(art => (
                        <SelectedProvider02 
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider02} 
                        />
                        ))}
                    </div>
                    )}
                </div>
                )}

                {selectedActivity?.id === 'C' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades na Neuropsicologia:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider03} 
                    onSelect={handleSelectProvider03} 
                    />
                    
                    {selectedProvider03.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider03.map(art => (
                        <SelectedProvider03 
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider03} 
                        />
                        ))}
                    </div>
                    )}
                </div> 
                )}

                {selectedActivity?.id === 'D' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades na Psicanálise:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider04} 
                    onSelect={handleSelectProvider04} 
                    />
                    
                    {selectedProvider04.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider04.map(art => (
                        <SelectedProvider04 
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider04} 
                        />
                        ))}
                    </div>
                    )}
                </div>
                )}

                {selectedActivity?.id === 'E' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades na Terapia Ocupacional:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider05} 
                    onSelect={handleSelectProvider05} 
                    />
                    
                    {selectedProvider05.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider05.map(art => (
                        <SelectedProvider05
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider05} 
                        />
                        ))}
                    </div>
                    )}
                </div>
                )}

                {selectedActivity?.id === 'F' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Selecione suas especialidades em Psicopedagogia:
                    </h2>
                    <SearchInput 
                    suggestions={CatProvider06} 
                    onSelect={handleSelectProvider06} 
                    />
                    
                    {selectedProvider06.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedProvider06.map(art => (
                        <SelectedProvider06
                            key={art.id} 
                            art={art} 
                            onRemove={handleRemoveProvider06} 
                        />
                        ))}
                    </div>
                    )}
                </div>
                )}

            </main>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
