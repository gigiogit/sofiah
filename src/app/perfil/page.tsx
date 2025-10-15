'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Sparkles, Loader2 } from 'lucide-react'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/context/AuthContext';
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

import Image from 'next/image'
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

export default function PerfilApp() {
  const { provAuthenticated, isReady } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedProvider01, setSelectedProvider01] = useState<Provider01Cat[]>([]);
  const [selectedProvider02, setSelectedProvider02] = useState<Provider02Cat[]>([]);
  const [selectedProvider03, setSelectedProvider03] = useState<Provider03Cat[]>([]);
  const [selectedProvider04, setSelectedProvider04] = useState<Provider04Cat[]>([]);
  const [selectedProvider05, setSelectedProvider05] = useState<Provider05Cat[]>([]);
  const [selectedProvider06, setSelectedProvider06] = useState<Provider06Cat[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  interface Modality {
    id: string;
    id_provider: number;
    id_modality: string;
    description_modality: string;
    id_category: string;
    description_category: string;
  }

  const [profileTxt, setProfileTxt] = useState({
    name: '',
    email: '',
    cep: '',
    bio: '',
    registro: '',
    formacao: '',
    publico: '',
    consultorio: '',
    preco_consulta: 0,
    atendimento_online: false,
    atendimento_presencial: false
  })

  const [profileImg, setProfileImg] = useState({
    photo_selfie: ''
  })

  const fileInputRef1 = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const fetchProfilePhoto = async (howPhoto: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/photo/${howPhoto}/${provAuthenticated}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.photo_upload;
    };
  
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${provAuthenticated}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfileTxt(prevProfile => ({
          ...prevProfile,
          name: data.name,
          email: data.email,
          cep: data.cep,
          bio: data.profile,
          registro: data.registro_profissional,
          formacao: data.formacao_profissional,
          publico: data.publico_atendimento,
          consultorio: data.endereco_consultorio,
          preco_consulta: data.preco_consulta,
          atendimento_online: data.atendimento_online,
          atendimento_presencial: data.atendimento_presencial
        }));

        const photo_selfie = await fetchProfilePhoto('photo_selfie');
        const photo_ads1 = await fetchProfilePhoto('photo_ads1');
        const photo_ads2 = await fetchProfilePhoto('photo_ads2');
        const photo_ads3 = await fetchProfilePhoto('photo_ads3');
        const photo_ads4 = await fetchProfilePhoto('photo_ads4');

        setProfileImg(prevProfile => ({
          ...prevProfile,
          photo_selfie: photo_selfie ? `data:image/jpeg;base64,${photo_selfie}` : '/profile_main.jpg?height=640&width=640',
          photo_ads1: photo_ads1 ? `data:image/jpeg;base64,${photo_ads1}` : '/profile_extra.jpg?height=640&width=640',
          photo_ads2: photo_ads2 ? `data:image/jpeg;base64,${photo_ads2}` : '/profile_extra.jpg?height=640&width=640',
          photo_ads3: photo_ads3 ? `data:image/jpeg;base64,${photo_ads3}` : '/profile_extra.jpg?height=640&width=640',
          photo_ads4: photo_ads4 ? `data:image/jpeg;base64,${photo_ads4}` : '/profile_extra.jpg?height=640&width=640'
        }));
      } catch (error) {
        console.error('Error fetch profile:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar o perfil. Por favor, recarregue a página.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (provAuthenticated !== 0) {
      fetchProfile();
    }
  }, [provAuthenticated, toast]);

  const formatCurrency = (value: number) => {
    const formattedValue = (value / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    return formattedValue
  }

  const txtToEmbedding = useCallback(async (description: string): Promise<number[] | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: description
        }),
      })
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.vector;
    } catch (error) {
      console.error('Error embbedding text:', error);
      return null;
    }
  }, []);

  const handleProfile = useCallback(async () => {
    try {
      const vectorProfile = await txtToEmbedding(profileTxt.bio);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: provAuthenticated,
          name: (profileTxt.name || ''),
          email: (profileTxt.email || ''),
          cep: (profileTxt.cep || ''),
          profile: (profileTxt.bio || ''),
          registro: (profileTxt.registro || ''),
          formacao: (profileTxt.formacao || ''),
          publico: (profileTxt.publico || ''),
          consultorio: (profileTxt.consultorio || ''),
          preco_consulta: profileTxt.preco_consulta,
          atendimento_online: profileTxt.atendimento_online,
          atendimento_presencial: profileTxt.atendimento_presencial,
          profile_embedding: vectorProfile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar o perfil. Por favor, tente novamente.",
      });
    }
  }, [provAuthenticated, profileTxt, toast, txtToEmbedding]);

  // Função para salvar imediatamente
  const saveImmediately = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      setSaveTimeoutId(null);
    }
    handleProfile();
  };

  // Função para auto-salvar com debounce
  const scheduleAutoSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    
    const timeoutId = setTimeout(() => {
      handleProfile();
      setSaveTimeoutId(null);
    }, 5000); // 5 segundos
    
    setSaveTimeoutId(timeoutId);
  };

  // Limpar timeout ao desmontar o componente e salvar se necessário
  useEffect(() => {
    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
        // Salvar imediatamente ao desmontar se há mudanças pendentes
        handleProfile();
      }
    };
  }, [saveTimeoutId, handleProfile]);

  // Salvar antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
        handleProfile();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveTimeoutId, handleProfile]);

  const handleAIProfile = async () => {
    try {
      setProfileTxt(prev => ({
        ...prev,
        bio: 'Aguarde, processando perfil com IA...'
      }));
      
      const especialidades = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modality/${provAuthenticated}`);
      if (!especialidades.ok) throw new Error('Falha ao buscar especialidades');
      const data0 = await especialidades.json();
      let especialidadesStr = '';
      if (data0.length > 0) {
        interface Modality {
          description_modality: string;
        }
        especialidadesStr = data0.map((item: Modality) => item.description_modality).join(', ');;
      }
      const prompt = `Crie um perfil para um profissional de saúde mental para ser divulgado
      em uma página onde diversos pacientes irão escolher aquele profissional que mais se identifica com o seu perfil.
      Segue as informações do profissional:
      Nome: ${profileTxt.name}
      Local de Formação profissional: ${profileTxt.formacao}
      Público que atende: ${profileTxt.publico}
      Especialidades e formações profissionais que possui: ${especialidadesStr}
      O texto deve ser em primeira pessoa, profissional e acolhedor, destacando experiência e especialidades.
      Mantenha um tom empático e humanizado.`;
      const systemContent = `Você é um assistente de IA especializado em perfis de profissionais de saúde mental.`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          systemContent: systemContent
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate AI profile');
      }
      const data1 = await response.json();
      setProfileTxt(prev => ({
        ...prev,
        bio: data1.analysis
      }));

      toast({
        title: "Sucesso",
        description: "Perfil gerado com sucesso!",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error generating AI profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar o perfil. Por favor, tente novamente.",
        duration: 3000,
      });
    }
    setIsConfirmDialogOpen(false);
  };

  const handleImageUpload = (howPhoto: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImageUploading(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append('image', compressedFile);
      formData.append('id', provAuthenticated.toString());
      formData.append('howPhoto', howPhoto);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      const data = await response.json();
      setProfileImg(prevProfile => ({
        ...prevProfile,
        [howPhoto]: `data:image/jpeg;base64,${data.photo_upload}`
      }));

      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao fazer upload da imagem. Por favor, tente novamente.",
      });
    } finally {
      setIsImageUploading(false);
    }
  };


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
      <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] pt-4 space-y-4">
        <div className="container mx-auto max-w-4xl py-8 flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-white">Você precisa estar autenticado para acessar esta página.</p>
          <Link 
            href="/login" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] pt-4 space-y-4">
        <div className="container mx-auto max-w-4xl py-8 flex items-center justify-center">
          <p className="text-lg text-white">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] pt-4 space-y-4">
        <div className="container mx-auto max-w-4xl py-8 flex items-center justify-center">
          <p className="text-lg text-white">Carregando perfil...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-0' : 'pt-4 space-y-4'} flex justify-center items-center`}>
      <div className={`w-full ${isMobile ? '' : 'sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]'}`}>
        <Card className="mb-4 shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-6">
              <div className="relative flex justify-center items-center w-full">
                <Image
                  src={profileImg.photo_selfie}
                  alt="Foto de perfil"
                  width={640}
                  height={640}
                  className="rounded-full"
                  style={{ width: '100%', height: 'auto' }}
                />
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)]"
                  onClick={() => fileInputRef1.current?.click()}
                  disabled={isImageUploading}
                >
                  {isImageUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef1}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload('photo_selfie')}
                />
                {isImageUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--primary-color)]" />
                      <span className="text-sm text-gray-600">Carregando foto...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex-grow">
                    <Input
                      value={profileTxt.name || ''}
                      onChange={(e) => {
                        setProfileTxt({ ...profileTxt, name: e.target.value });
                        scheduleAutoSave();
                      }}
                      onBlur={saveImmediately}
                      placeholder="Digite aqui o seu nome"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Input
                value={profileTxt.registro || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, registro: e.target.value });
                  scheduleAutoSave();
                }}
                onBlur={saveImmediately}
                placeholder="Digite aqui o seu registro profissional"
                className="w-full"
              />

              <Input
                value={profileTxt.formacao || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, formacao: e.target.value });
                  scheduleAutoSave();
                }}
                onBlur={saveImmediately}
                placeholder="Digite aqui a sua formação profissional"
                className="w-full"
              />

              <Input
                value={profileTxt.publico || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, publico: e.target.value });
                  scheduleAutoSave();
                }}
                onBlur={saveImmediately}
                placeholder="Digite aqui o tipo de público que atende, ex: crianças, adolescentes, adultos, idosos"
                className="w-full"
              />

              <div className="flex gap-4">
                <div className="font-medium text-gray-600 whitespace-nowrap">Valor da consulta:</div>
                <Input
                  value={formatCurrency(profileTxt.preco_consulta)}
                  onChange={(e) => {
                    const numericValue = parseFloat(e.target.value.replace(/\D/g, ""));
                    setProfileTxt({ ...profileTxt, preco_consulta: numericValue });
                    scheduleAutoSave();
                  }}
                  className="font-medium text-gray-600 whitespace-nowrap"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch 
                  checked={profileTxt.atendimento_online || false}
                  onCheckedChange={(checked) => {
                    setProfileTxt(prev => ({ ...prev, atendimento_online: checked }));
                    scheduleAutoSave();
                  }} 
                  className="cursor-pointer data-[state=checked]:bg-[var(--primary-color)]"
                />
                <span className="text-gray-600">Atendimento Remoto</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={profileTxt.atendimento_presencial || false}
                  onCheckedChange={(checked) => {
                    setProfileTxt(prev => ({ ...prev, atendimento_presencial: checked }));
                    scheduleAutoSave();
                  }} 
                  className="cursor-pointer data-[state=checked]:bg-[var(--primary-color)]"
                />
                <span className="text-gray-600">Atendimento Presencial</span>
              </div>

              <Input
                value={profileTxt.consultorio || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, consultorio: e.target.value });
                  scheduleAutoSave();
                }}
                placeholder="Digite aqui o endereço de atendimento presencial"
                className="w-full"
              />

              <Input
                value={profileTxt.cep || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, cep: e.target.value });
                  scheduleAutoSave();
                }}
                placeholder="Digite aqui o CEP do local de atendimento"
                className="w-full"
              />

              <Input
                value={profileTxt.email || ''}
                onChange={(e) => {
                  setProfileTxt({ ...profileTxt, email: e.target.value });
                  scheduleAutoSave();
                }}
                placeholder="Digite aqui o seu e-mail"
                className="w-full"
              />

            </main>
          </CardContent>
        </Card>

        <Card className="mb-4 shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative">
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Formação:</h2>
              <ActivitySelector 
                  activities={activities}
                  selectedActivity={selectedActivity}
                  onSelect={handleActivitySelect}
                  refreshKey={refreshKey}
              />

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

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Perfil Profissional:
              </h2>
              <div className="relative flex justify-between items-center w-full">
                <Textarea
                  value={profileTxt.bio || ''}
                  onChange={(e) => {
                    setProfileTxt({ ...profileTxt, bio: e.target.value });
                    scheduleAutoSave();
                  }}
                  onBlur={saveImmediately}
                  className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Digite aqui o seu perfil profissional"
                  rows={10}
                />
                <Button 
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)]"
                  title="Preencher perfil com a IA."
                  onClick={() => { setIsConfirmDialogOpen(true) }}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </main>

          </CardContent>
        </Card>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-gray-900">Gerar perfil com IA</DialogTitle>
              <DialogDescription>
                Vamos criar um perfil profissional com a ajuda de IA, certifique-se de ter preenchido as suas especialidades antes no menu.
                Todas as informações do perfil serão removidas e substituídas por um perfil gerado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Fechar</Button>
              <Button className="text-gray-900" variant="destructive" onClick={handleAIProfile}>Gerar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        
      </div>
      <Toaster />
    </div>
  )
}

