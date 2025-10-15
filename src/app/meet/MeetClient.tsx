'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Video, VideoOff, Share2, Phone, Send, Captions, CaptionsOff, Sparkles, Paperclip, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Peer from 'simple-peer';
import './MeetPage.css';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const VOSK_SERVER_URL = process.env.NEXT_PUBLIC_VOSK_URL; // Ex: 'ws://localhost:2700'

interface Message {
  isHost: boolean;
  sender: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
  isSaved?: boolean;
  isLocal?: boolean;
}

interface TranscriptionSegmentPayload {
  text: string;
  senderRole: 'host' | 'guest';
  timestamp: number;
}

interface ServerToClientEvents {
  'user-connected': (peerSocketId: string) => void;
  'user-disconnected': () => void;
  'offer': (offererId: string, offer: Peer.SignalData) => void;
  'answer': (answererId: string, answer: Peer.SignalData) => void;
  'ice-candidate': (candidateId: string, candidate: Peer.SignalData) => void;
  'chat-message': (message: Message) => void;
  'transcription-segment': (payload: TranscriptionSegmentPayload) => void;
  'transcription-started': () => void;
  'transcription-stopped': () => void;
  'call-ended': () => void;
}

interface ClientToServerEvents {
  'join-room': (roomId: string, userId: string) => void;
  'offer': (targetUserId: string, offer: Peer.SignalData) => void;
  'answer': (targetUserId: string, answer: Peer.SignalData) => void;
  'ice-candidate': (targetUserId: string, candidate: Peer.SignalData) => void;
  'chat-message': (roomId: string, message: Message) => void;
  'transcription-segment': (roomId: string, payload: TranscriptionSegmentPayload) => void;
  'transcription-started': (roomId: string) => void;
  'transcription-stopped': (roomId: string) => void;
  'end-call': (roomId: string) => void;
}

const MeetClient: React.FC = () => {
  // ... (Refs e States existentes) ...
  const params = useParams();
  const meetingId = params.meetingId as string;
  const { toast } = useToast()
  const { provAuthenticated } = useAuth();

  // Refs
  const userVideo = useRef<HTMLVideoElement>(null);
  const peerVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance | null>(null);
  const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptionRef = useRef<string>('');
  const isTranscribingRef = useRef<boolean>(false);
  const transcriptionScrollRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voskRef = useRef<{ stop: () => void } | null>(null);

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [participantsCount, setParticipantsCount] = useState(1);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [providerName, setProviderName] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [statusMeeting, setStatusMeeting] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isGeneratingProntuario, setIsGeneratingProntuario] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const loadMeetingMessages = useCallback(async () => {
    if (!meetingId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/${meetingId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      const loadedMessages = data.messages.map((msg: Message) => ({ ...msg, isSaved: true, isLocal: false }));
      messagesRef.current = loadedMessages;
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [meetingId]);

  const handleSaveTranscription = useCallback(async () => {
    try {
      const currentTranscription = transcriptionRef.current;
      if (!meetingId || !currentTranscription) return;
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, transcription: currentTranscription }),
      });
      console.log('Transcrição salva com sucesso!');
    } catch (error) {
      console.error('Error saving transcription:', error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar a transcrição." });
    }
  }, [meetingId, toast]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveTranscription();
    }, 5000);
  }, [handleSaveTranscription]);

  const saveMeetingMessages = useCallback(async () => {
    const unsavedMessages = messagesRef.current.filter(msg => !msg.isSaved);
    if (!meetingId || unsavedMessages.length === 0) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const messagesToSave = unsavedMessages.map(({ isLocal, ...msg }) => msg);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, messages: messagesToSave }),
      });

      messagesRef.current = messagesRef.current.map(msg => ({ ...msg, isSaved: true }));
      setMessages(messagesRef.current);
      console.log('Mensagens salvas com sucesso!');
    } catch (error) {
      console.error('Error saving messages:', error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar as mensagens." });
    }
  }, [meetingId, toast]);

  const scheduleMessagesSave = useCallback(() => {
    if (messagesSaveTimeoutRef.current) clearTimeout(messagesSaveTimeoutRef.current);
    messagesSaveTimeoutRef.current = setTimeout(() => {
      saveMeetingMessages();
    }, 3000);
  }, [saveMeetingMessages]);

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim()) return;

    const newMessage: Message = {
      isHost: provAuthenticated !== 0,
      sender: provAuthenticated !== 0 ? providerName : userName,
      text: currentMessage.trim(),
      timestamp: new Date().toISOString(),
      isSaved: false,
      isLocal: true
    };

    messagesRef.current = [...messagesRef.current, newMessage];
    setMessages(messagesRef.current);

    if (socket.current?.connected) {
      socket.current.emit('chat-message', meetingId, newMessage);
    }
    scheduleMessagesSave();
    setCurrentMessage('');
  }, [currentMessage, provAuthenticated, providerName, userName, meetingId, scheduleMessagesSave]);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 10MB." });
      return;
    }

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meetingId', meetingId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      
      const messageWithFile: Message = {
        isHost: provAuthenticated !== 0,
        sender: provAuthenticated !== 0 ? providerName : userName,
        text: '',
        timestamp: new Date().toISOString(),
        attachment: { name: file.name, url: result.url, type: file.type, size: file.size },
        isSaved: false,
        isLocal: true
      };

      messagesRef.current = [...messagesRef.current, messageWithFile];
      setMessages(messagesRef.current);
      if (socket.current?.connected) {
        socket.current.emit('chat-message', meetingId, messageWithFile);
      }
      scheduleMessagesSave();
      toast({ title: "Arquivo enviado", description: "O arquivo foi enviado com sucesso." });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ variant: "destructive", title: "Erro no upload", description: "Não foi possível enviar o arquivo." });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [meetingId, provAuthenticated, providerName, userName, scheduleMessagesSave, toast]);

  const startVoskTranscription = useCallback(() => {
    if (!localStreamRef.current || voskRef.current || !VOSK_SERVER_URL) {
      console.log("Não foi possível iniciar o Vosk: stream, voskRef ou URL ausentes.");
      return;
    }

    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    const voskSocket = new WebSocket(VOSK_SERVER_URL);
    let audioResampler: ((data: Float32Array) => Int16Array) | null = null;

    voskSocket.onopen = () => {
      console.log("Conexão com o servidor Vosk estabelecida.");
      // Configura o resampler quando a conexão é estabelecida
      audioResampler = createAudioResampler(audioContext.sampleRate, 16000);
      // Envia a configuração para o Vosk
      voskSocket.send(JSON.stringify({ config: { sample_rate: 16000 } }));
      processor.onaudioprocess = (event) => {
        if (!audioResampler) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const resampledData = audioResampler(inputData);
        if (voskSocket.readyState === WebSocket.OPEN) {
          voskSocket.send(resampledData.buffer);
        }
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
    };

    voskSocket.onmessage = (event) => {
      const result = JSON.parse(event.data);
      if (result.text) {
        const role = provAuthenticated !== 0 ? 'host' : 'guest';
        const payload: TranscriptionSegmentPayload = {
          text: result.text,
          senderRole: role,
          timestamp: Date.now(),
        };

        if (role === 'host') {
          // Host: exibe diretamente e agenda salvamento
          const newSegment = `[${new Date(payload.timestamp).toLocaleTimeString()}] [Profissional]: ${payload.text}\n`;
          transcriptionRef.current += newSegment;
          setTranscription(prev => prev + newSegment);
          scheduleAutoSave();
        } else {
          // Convidado: envia para o servidor da plataforma
          socket.current?.emit('transcription-segment', meetingId, payload);
        }
      }
    };

    voskSocket.onerror = (error) => {
      console.error("Erro no WebSocket do Vosk:", error);
      toast({ variant: "destructive", title: "Erro de Transcrição", description: "Não foi possível conectar ao serviço de transcrição." });
    };

    voskSocket.onclose = () => {
      console.log("Conexão com o servidor Vosk fechada.");
    };

    const stop = () => {
      if (audioContext.state !== 'closed') {
        source.disconnect();
        processor.disconnect();
        audioContext.close();
      }
      if (voskSocket.readyState === WebSocket.OPEN) {
        voskSocket.send('{"eof" : 1}');
        voskSocket.close();
      }
      voskRef.current = null;
    };

    voskRef.current = { stop };
  }, [provAuthenticated, meetingId, scheduleAutoSave, toast]);

  const stopVoskTranscription = useCallback(() => {
    if (voskRef.current) {
      voskRef.current.stop();
    }
  }, []);

  // Função auxiliar para reamostragem de áudio
  const createAudioResampler = (inputRate: number, outputRate: number) => {
    if (inputRate === outputRate) {
      return (data: Float32Array) => {
        const output = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) {
          output[i] = Math.max(-1, Math.min(1, data[i])) * 0x7FFF;
        }
        return output;
      };
    }
    const ratio = inputRate / outputRate;
    return (data: Float32Array) => {
      const outputLength = Math.floor(data.length / ratio);
      const output = new Int16Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        const before = Math.floor(i * ratio);
        output[i] = Math.max(-1, Math.min(1, data[before])) * 0x7FFF;
      }
      return output;
    };
  };

  const toggleTranscription = useCallback(() => {
    if (!VOSK_SERVER_URL) {
      toast({ variant: "destructive", title: "Funcionalidade indisponível", description: "O serviço de transcrição não está configurado." });
      return;
    }

    const nextIsTranscribing = !isTranscribing;
    setIsTranscribing(nextIsTranscribing);
    isTranscribingRef.current = nextIsTranscribing;

    if (nextIsTranscribing) {
      socket.current?.emit('transcription-started', meetingId);
    } else {
      socket.current?.emit('transcription-stopped', meetingId);
    }
  }, [isTranscribing, meetingId, toast]);

  // --- FIM DA NOVA LÓGICA ---

  // ... (funções de cleanup e handleEndCall precisam ser ajustadas) ...
  const cleanupAllConnections = useCallback(() => {
    console.log('Iniciando cleanup completo de todas as conexões...');
    
    // Parar transcrição do Vosk
    stopVoskTranscription();
    setIsTranscribing(false);
    isTranscribingRef.current = false;

    // Parar todas as tracks de mídia
    if (localStreamRef.current) {
      console.log('Parando tracks do stream local...');
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} parada`);
      });
      localStreamRef.current = null;
    }

    // Limpar elementos de vídeo
    if (userVideo.current) {
      console.log('Limpando vídeo do usuário...');
      userVideo.current.srcObject = null;
    }
    if (peerVideo.current) {
      console.log('Limpando vídeo do peer...');
      peerVideo.current.srcObject = null;
    }

    // Destruir conexão WebRTC
    if (connectionRef.current) {
      console.log('Destruindo conexão WebRTC...');
      connectionRef.current.destroy();
      connectionRef.current = null;
    }

    // Desconectar socket
    if (socket.current) {
      console.log('Desconectando socket...');
      socket.current.disconnect();
      socket.current = null;
    }

    // Limpar timeout de save
    if (saveTimeoutRef.current) {
      console.log('Limpando timeout de save...');
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    console.log('Cleanup completo finalizado.');
  }, [stopVoskTranscription]);

  const handleEndCall = useCallback(async () => {
    console.log('Encerrando chamada...');
    
    // Notificar o outro participante que a chamada está terminando
    if (socket.current?.connected) {
      socket.current.emit('end-call', meetingId);
    }

    try {
      // Primeiro, atualiza o status no backend
      await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: calendarId, status: 1 }),
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: meetingId, status: 1 }),
        })
      ]);

      // Atualiza o estado local
      setStatusMeeting(1);
      
      // Somente depois do sucesso, executa a limpeza completa
      cleanupAllConnections();

    } catch (error) {
      console.error('Error change status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao encerrar a sessão. Por favor, tente novamente!",
        duration: 3000,
      });
      // Mesmo em caso de erro, tentamos limpar as conexões
      cleanupAllConnections();
    }
  }, [calendarId, meetingId, toast, cleanupAllConnections]);

  // --- USE EFFECTS ---

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(isMobileDevice || window.innerWidth <= 768);
    // REMOVA setSpeechRecognitionSupported
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const meetingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/${meetingId}`);
        if (!meetingRes.ok) throw new Error('Failed to fetch meeting data');
        const meetingData = await meetingRes.json();

        // Sempre carregar os dados essenciais
        setUserId(meetingData.user_id);
        setTranscription(meetingData.transcription || '');
        transcriptionRef.current = meetingData.transcription || '';
        setCalendarId(meetingData.calendar_id);
        setStatusMeeting(meetingData.status);

        // Se a sessão estiver finalizada, não precisamos buscar nomes de participantes para a chamada
        if (meetingData.status === 1) {
          return; 
        }

        const hostRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${meetingData.host_id}`);
        const hostData = await hostRes.json();
        setProviderName(hostData.name);

        if (meetingData.user_id) {
          const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${meetingData.user_id}`);
          const userData = await userRes.json();
          setUserName(userData.name);
          setUserPhone(userData.phone);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados da sessão." });
      }
    };
    fetchInitialData();
    loadMeetingMessages();
  }, [meetingId, loadMeetingMessages, toast]);

  useEffect(() => {
    if (statusMeeting === 1) return;

    const socketInstance = io(SOCKET_SERVER_URL as string, { transports: ['websocket'], forceNew: true });
    socket.current = socketInstance;

    const setupWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (userVideo.current) userVideo.current.srcObject = stream;

        socketInstance.emit('join-room', meetingId, userId);
        // REMOVA a emissão de 'guest-transcription-capability'
      } catch (error) {
        console.error("Erro ao obter mídia:", error);
        toast({ variant: "destructive", title: "Erro de Mídia", description: "Verifique as permissões de câmera e microfone." });
      }
    };
    setupWebRTC();

    // --- OUVINTES DE EVENTOS DO SOCKET ---

    // WebRTC
    socketInstance.on('user-connected', (peerSocketId) => {
      setParticipantsCount(2);
      if (!localStreamRef.current) return;
      const peer = new Peer({ initiator: true, trickle: false, stream: localStreamRef.current });
      peer.on('signal', data => socketInstance.emit('offer', peerSocketId, data));
      peer.on('stream', stream => { if (peerVideo.current) peerVideo.current.srcObject = stream; });
      connectionRef.current = peer;
    });

    socketInstance.on('offer', (offererId, offer) => {
      setParticipantsCount(2);
      if (!localStreamRef.current) return;
      const peer = new Peer({ initiator: false, trickle: false, stream: localStreamRef.current });
      peer.on('signal', data => socketInstance.emit('answer', offererId, data));
      peer.on('stream', stream => { if (peerVideo.current) peerVideo.current.srcObject = stream; });
      peer.signal(offer);
      connectionRef.current = peer;
    });

    socketInstance.on('answer', (answererId, answer) => connectionRef.current?.signal(answer));
    
    socketInstance.on('user-disconnected', () => {
      // Se a chamada já foi finalizada, não faça nada
      if (statusMeeting === 1) return;

      setParticipantsCount(1);
      if (peerVideo.current) peerVideo.current.srcObject = null;
      connectionRef.current?.destroy();
    });

    const onCallEnded = () => {
      console.log('A chamada foi encerrada pelo outro participante.');
      toast({ title: "Sessão Encerrada", description: "O outro participante encerrou a sessão." });
      cleanupAllConnections();
      setStatusMeeting(1);
    };

    // Chat e Transcrição
    const onChatMessage = (message: Message) => {
      if (!messagesRef.current.some(m => m.timestamp === message.timestamp && m.sender === message.sender)) {
        messagesRef.current = [...messagesRef.current, { ...message, isSaved: true, isLocal: false }];
        setMessages(messagesRef.current);
      }
    };
    const onTranscriptionStarted = () => {
      // Tanto o host quanto o convidado iniciam sua própria transcrição
      startVoskTranscription();
      if (provAuthenticated === 0) {
        toast({ title: "Transcrição Ativada", description: "A sua fala está sendo transcrita para o profissional." });
      }
    };
    const onTranscriptionStopped = () => {
      // Tanto o host quanto o convidado param sua própria transcrição
      stopVoskTranscription();
      if (provAuthenticated === 0) {
        toast({ title: "Transcrição Interrompida", description: "A transcrição da sessão foi interrompida pelo profissional." });
      }
    };
    // REMOVA onGuestTranscriptionAvailable e onGuestTranscriptionStatus
    const onTranscriptionSegment = (payload: TranscriptionSegmentPayload) => {
      // O host (provAuthenticated !== 0) só deve processar segmentos recebidos do convidado (guest)
      if (provAuthenticated !== 0 && payload.senderRole === 'guest') {
        const newSegment = `[${new Date(payload.timestamp).toLocaleTimeString()}] [Paciente]: ${payload.text}\n`;
        transcriptionRef.current += newSegment;
        setTranscription(prev => prev + newSegment);
        scheduleAutoSave();
      }
    };

    socketInstance.on('chat-message', onChatMessage);
    socketInstance.on('transcription-started', onTranscriptionStarted);
    socketInstance.on('transcription-stopped', onTranscriptionStopped);
    // REMOVA os listeners para 'guest-transcription-available' e 'guest-transcription-status'
    socketInstance.on('transcription-segment', onTranscriptionSegment);
    socketInstance.on('call-ended', onCallEnded);

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      connectionRef.current?.destroy();
      socketInstance.disconnect();
      stopVoskTranscription(); // Garante que a transcrição pare
    };
  }, [meetingId, userId, statusMeeting, provAuthenticated, toast, scheduleAutoSave, cleanupAllConnections, startVoskTranscription, stopVoskTranscription]);

  // Salvar e cleanup antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('Página sendo fechada ou recarregada...');
      
      // Salvar transcrição se necessário
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        handleSaveTranscription();
      }
      
      // Salvar mensagens se necessário
      if (messagesSaveTimeoutRef.current) {
        clearTimeout(messagesSaveTimeoutRef.current);
        saveMeetingMessages();
      }
      
      // Executar cleanup completo
      cleanupAllConnections();
      
      // Opcional: mostrar confirmação para o usuário
      if (participantsCount > 1 && statusMeeting === 0) {
        event.preventDefault();
        event.returnValue = 'Você tem certeza que deseja sair? A sessão será encerrada.';
        return event.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('Página ficou oculta...');
        // Salvar transcrição quando a página fica oculta
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          handleSaveTranscription();
        }
        // Salvar mensagens quando a página fica oculta
        if (messagesSaveTimeoutRef.current) {
          clearTimeout(messagesSaveTimeoutRef.current);
          saveMeetingMessages();
        }
      }
    };

    // Adicionar listeners para diferentes eventos de saída
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', cleanupAllConnections);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('Removendo event listeners...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', cleanupAllConnections);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleSaveTranscription, cleanupAllConnections, participantsCount, statusMeeting, saveMeetingMessages]);

  useEffect(() => { if (localStreamRef.current) localStreamRef.current.getAudioTracks()[0].enabled = isMicOn; }, [isMicOn]);
  useEffect(() => { if (localStreamRef.current) localStreamRef.current.getVideoTracks()[0].enabled = isCameraOn; }, [isCameraOn]);
  useEffect(() => { if (messagesScrollRef.current) messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (transcriptionScrollRef.current) transcriptionScrollRef.current.scrollTop = transcriptionScrollRef.current.scrollHeight; }, [transcription]);

  // --- HELPER FUNCTIONS ---
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    handleSaveTranscription();
  }, [handleSaveTranscription]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
  };

  const handleDownloadFile = (attachment: { name: string; url: string }) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleSendLink = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/sendmessagesoniah`, {      
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userPhone,
          message: `Olá ${userName},\n\nO link para a sessão com ${providerName} é:\n${process.env.NEXT_PUBLIC_SITE_URL}/meet/${meetingId}\n\nEstamos te aguardando para dar início!`,
        }),
      });
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Ocorreu um erro ao enviar mensagem para o WhatsApp. Por favor, tente novamente.",
          duration: 3000,
        });
      } else {
        toast({
          variant: "default",
          title: "Sucesso",
          description: "Link para a sessão enviado com sucesso para o WhatsApp do paciente.",
          duration: 3000,
        });
      }
    } catch (error) {
        console.error('Error whatsapp sending:', error);
    }
  }, [meetingId, providerName, userName, userPhone, toast]);

  const handleAIProntuario = async () => {
    setIsConfirmDialogOpen(false);
    setIsGeneratingProntuario(true);
    try {
      const prompt = `Gere um prontuário psicológico a partir da transcrição da sessão abaixo.
      Seja objetivo e sucinto, com base nos tópicos obrigatórios, conforme as diretrizes do Conselho Federal de Psicologia.
      A linguagem deve ser técnica, clara, e descritiva, sem juízo de valor.
      Não usar o formato markdown no texto a ser gerado, porém mantendo a formatação de tópicos:
      **MODELO DE PRONTUÁRIO PSICOLÓGICO – TÓPICOS**
      1. Queixa principal (relato do paciente):
      (Transcreva de forma objetiva as queixas e sentimentos apresentados pelo paciente)
      2. Observações clínicas e hipóteses diagnósticas:
      (Descreva os comportamentos observáveis, afeto, discurso, fluidez, coerência e possíveis hipóteses dentro dos critérios da CID-10/DSM-5)
      3. Intervenções realizadas pelo psicólogo:
      (Descrever as estratégias terapêuticas utilizadas, como acolhimento, identificação de padrões, psicoeducação, validação emocional etc.)
      4. Encaminhamentos e condutas:
      (Casos de necessidade de encaminhamento, proposta de continuidade, tarefas para casa etc.)
      TRANSCRIÇÃO DA SESSÃO: ${transcriptionRef.current}`;
      const systemContent = `Você é um assistente de IA especializado em fazer prontuário a partir da transcrição de uma sessão entre profissional e paciente.`;

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
      const data = await response.json();

      const responsePront = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/prontuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: calendarId,
          prontuario: data.analysis,
        }),
      });

      if (!responsePront.ok) {
        throw new Error('Failed to save event')
      }

      toast({
        title: "Sucesso",
        description: "Prontuário gerado com sucesso!",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error generating AI medical record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar o prontuário. Por favor, tente novamente.",
        duration: 3000,
      });
    } finally {
      setIsGeneratingProntuario(false);
    }
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-2' : 'p-4'}`}>

      {isMobile ? (
        // Layout Mobile
        <div className="w-full h-screen">
          {/* Card de Vídeo - Mobile (Altura fixa em 3/4 da tela) */}
          <Card className="mb-4 bg-white shadow-[12px] relative h-2/3">
            <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative py-2 min-h-0">
              <CardTitle className="text-sm">Vídeo</CardTitle>
              {/* Indicador de transcrição para convidados */}
              {provAuthenticated === 0 && isTranscribing && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Transcrevendo...</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-2 h-[calc(100%-2.5rem)]">
              <div className="meet-container h-full relative">
                <div className="video-main-view h-full relative">
                  <video 
                    ref={peerVideo} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-contain block"
                  />

                  {statusMeeting === 1 ? (
                    <div className="waiting-overlay">
                      <div className="waiting-content text-white"><h2>Sessão Finalizada</h2></div>
                    </div>
                  ) : participantsCount === 1 ? (
                    <div className="waiting-overlay">
                      <div className="waiting-content text-white"><h2>Aguardando conexão...</h2></div>
                    </div>
                  ) : (
                    <div className="participant-name">{provAuthenticated !== 0 ? userName : providerName}</div>
                  )}
                </div>

                {/* Vídeo local - Picture-in-Picture */}
                {statusMeeting !== 1 && (
                  <div className="local-video-pip absolute top-4 right-4 w-24 h-32 z-[60]">
                    <video 
                      ref={userVideo} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                    <div className="participant-name text-xs">
                      {provAuthenticated === 0 ? userName : providerName}
                    </div>
                  </div>
                )}

                {/* Barra de Controles */}
                {statusMeeting === 0 && (
                  <div className="controls-bar flex justify-center gap-4 absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-4 py-2 z-[60]">
                    {provAuthenticated !== 0 && (
                      <button className="control-button secondary" onClick={handleSendLink}>
                        <Share2 size={20} />
                      </button>
                    )}
                    {provAuthenticated !== 0 && (
                      <button className={`control-button secondary ${!isTranscribing ? 'toggled-off' : ''}`} onClick={toggleTranscription}>
                        {isTranscribing ? <Captions size={20} /> : <CaptionsOff size={20} />}
                      </button>
                    )}
                    <button className={`control-button secondary ${!isMicOn ? 'toggled-off' : ''}`} onClick={() => setIsMicOn(p => !p)}>
                      {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <button className={`control-button secondary ${!isCameraOn ? 'toggled-off' : ''}`} onClick={() => setIsCameraOn(p => !p)}>
                      {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                    <button className="control-button" onClick={() => setIsConfirmEndOpen(true)}>
                      <Phone size={20} />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Mensagens - Mobile (ocupa o resto da tela) */}
          <Card className="mb-4 bg-white shadow-[12px] relative">
            <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative py-2 min-h-0">
              <CardTitle className="text-sm">Mensagens</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-full flex flex-col">
                <div className="messages-display flex-1 overflow-y-auto mb-2" ref={messagesScrollRef}>
                  {messages.map((msg, index) => (
                    <div key={index} className={`message text-xs mb-2 ${(msg.isHost !== (provAuthenticated === 0)) ? 'self' : 'other'}`}>
                      <div className="message-sender font-semibold">{msg.sender}</div>
                      <div className="break-words">{msg.text}</div>
                      {msg.attachment && (
                        <div className="mt-1 p-2 border border-gray-200 rounded bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Paperclip size={12} className="text-gray-600" />
                            <a 
                              href={msg.attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              {msg.attachment.name}
                            </a>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs text-gray-500">
                              {formatFileSize(msg.attachment.size)}
                            </div>
                            <button
                              onClick={() => handleDownloadFile(msg.attachment!)}
                              className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-1 py-1 rounded"
                              title="Baixar arquivo"
                            >
                              <Download size={10} />
                              Baixar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="message-input flex gap-1">
                  <input
                    type="text"
                    placeholder="Enviar mensagem..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 text-xs p-1 rounded border"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={onFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <button 
                    onClick={handleFileSelect}
                    disabled={isUploadingFile}
                    className="p-1 rounded bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                    title="Enviar arquivo"
                  >
                    {isUploadingFile ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Paperclip size={12} />
                    )}
                  </button>
                  <button onClick={handleSendMessage} className="p-1 rounded bg-[var(--primary-color)] text-white">
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Layout Desktop
        <div className="w-full h-screen max-w-full flex gap-4">
          {/* Coluna Esquerda - Vídeo (Altura total da tela) */}
          <div className="w-3/4">
            <Card className={`${provAuthenticated !== 0 ? 'h-[calc(100vh-120px)]' : 'h-screen'} mb-4 bg-white shadow-[12px] relative`}>
              <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative py-2 min-h-0">
                <CardTitle className="text-sm">
                  Vídeo
                </CardTitle>
                {/* Indicador de transcrição para convidados - Desktop */}
                {provAuthenticated === 0 && isTranscribing && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Transcrevendo...</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-2 h-[calc(100%-4rem)]">
                <div className="meet-container h-full relative">
                  <div className="video-main-view h-full relative">
                    <video ref={peerVideo} autoPlay playsInline className="w-full h-full object-contain" />

                    {statusMeeting === 1 ? (
                      <div className="waiting-overlay text-white"><h2>Sessão Finalizada</h2></div>
                    ) : participantsCount === 1 ? (
                      <div className="waiting-overlay text-white"><h2>Aguardando conexão...</h2></div>
                    ) : (
                      <div className="participant-name">{provAuthenticated !== 0 ? userName : providerName}</div>
                    )}
                  </div>

                  {/* Vídeo local - Picture-in-Picture */}
                  {statusMeeting !== 1 && (
                    <div className="local-video-pip absolute top-4 right-4 w-48 h-36 z-[60]">
                      <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover rounded-lg" />
                      <div className="participant-name">{provAuthenticated === 0 ? userName : providerName}</div>
                    </div>
                  )}

                  {/* Barra de Controles */}
                  {statusMeeting === 0 && (
                    <div className="controls-bar flex justify-center gap-4 absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-6 py-3 z-[60]">
                      {provAuthenticated !== 0 && (
                        <button className="control-button secondary" onClick={handleSendLink}>
                          <Share2 size={24} />
                        </button>
                      )}
                      {provAuthenticated !== 0 && (
                        <button className={`control-button secondary ${!isTranscribing ? 'toggled-off' : ''}`} onClick={toggleTranscription}>
                          {isTranscribing ? <Captions size={24} /> : <CaptionsOff size={24} />}
                        </button>
                      )}
                      <button className={`control-button secondary ${!isMicOn ? 'toggled-off' : ''}`} onClick={() => setIsMicOn(p => !p)}>
                        {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                      </button>
                      <button className={`control-button secondary ${!isCameraOn ? 'toggled-off' : ''}`} onClick={() => setIsCameraOn(p => !p)}>
                        {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                      </button>
                      <button className="control-button" onClick={() => setIsConfirmEndOpen(true)}>
                        <Phone size={24} />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Transcrição e Mensagens */}
          <div className={`w-1/4 flex flex-col gap-4 ${provAuthenticated !== 0 ? 'h-[calc(100vh-120px)]' : 'h-screen'}`}>
            {/* Card de Transcrição - Apenas para host */}
            {provAuthenticated !== 0 && (
              <Card className="h-2/3 bg-white shadow-[12px] relative">
                <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative py-2 min-h-0">
                  <CardTitle className="text-sm">
                    Transcrição
                  </CardTitle>
                  {isTranscribing && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs">Transcrevendo...</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-2 h-[calc(100%-3rem)]">
                  <Textarea
                    ref={transcriptionScrollRef}
                    value={transcription}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setTranscription(newValue);
                      transcriptionRef.current = newValue;
                      scheduleAutoSave();
                    }}
                    onBlur={saveImmediately}
                    className="w-full h-full resize-none"
                    placeholder={"Use o botão de transcrição para iniciar..."}
                  />
                  <Button 
                    size="icon"
                    className="absolute bottom-2 right-2 rounded-full bg-[var(--primary-color)] h-8 w-8"
                    title="Preencher perfil com a IA."
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
            {/* Card de Mensagens */}
            <Card className={`${provAuthenticated !== 0 ? 'h-1/3' : 'h-screen'} bg-white shadow-[12px] relative`}>
              <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px] relative py-2 min-h-0">
                <CardTitle className="text-sm">
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 h-[calc(100%-3rem)]">
                <div className="h-full flex flex-col">
                  <div className="messages-display flex-1 overflow-y-auto mb-2" ref={messagesScrollRef}>
                    {messages.map((msg, index) => (
                      <div key={index} className={`message text-xs mb-2 ${(msg.isHost !== (provAuthenticated === 0)) ? 'self' : 'other'}`}>
                        <div className="message-sender font-semibold">{msg.sender}</div>
                        <div className="break-words">{msg.text}</div>
                        {msg.attachment && (
                          <div className="mt-1 p-2 border rounded bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Paperclip size={12} className="text-gray-600" />
                              <a 
                                href={msg.attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                {msg.attachment.name}
                              </a>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="text-xs text-gray-500">
                                {formatFileSize(msg.attachment.size)}
                              </div>
                              <button
                                onClick={() => handleDownloadFile(msg.attachment!)}
                                className="flex items-center gap-1 text-xs bg-blue-500 text-white px-1 py-1 rounded"
                                title="Baixar arquivo"
                              >
                                <Download size={10} />
                                Baixar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="message-input flex gap-1">
                    <input
                      type="text"
                      placeholder="Enviar mensagem..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 text-xs p-1 rounded border"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onFileChange}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                    />
                    <button 
                      onClick={handleFileSelect}
                      disabled={isUploadingFile}
                      className="p-1 rounded bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                      title="Enviar arquivo"
                    >
                      {isUploadingFile ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <Paperclip size={12} />
                      )}
                    </button>
                    <button onClick={handleSendMessage} className="p-1 rounded bg-[var(--primary-color)] text-white">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialogs e Notificações */}
      <Dialog open={isConfirmEndOpen} onOpenChange={setIsConfirmEndOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirmar encerramento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja encerrar a sessão?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmEndOpen(false)}>Fechar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleEndCall()
                setIsConfirmEndOpen(false);
              }}
            >
              Encerrar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Gerar prontuário com IA</DialogTitle>
            <DialogDescription>
              Vamos criar um prontuário com a ajuda de IA, certifique-se de ter analisado a transcrição da sessão antes de prosseguir.
              Todas as informações do prontuário que possam existir desta sessão, serão removidas e substituídas por um prontuário gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-gray-900" variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Fechar</Button>
            <Button className="text-gray-900" variant="destructive" onClick={handleAIProntuario}>Gerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>        

      <Dialog open={isGeneratingProntuario} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-color)]"></div>
              Gerando Prontuário
            </DialogTitle>
            <DialogDescription>
              Aguarde enquanto a IA analisa a transcrição e gera o prontuário psicológico...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
};

export default MeetClient;