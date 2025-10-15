const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const eventRoutes = require('./eventRoutes');
const socketIo = require('socket.io');
const speech = require('@google-cloud/speech'); // Importar Google Speech
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://192.168.1.15:3000'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', eventRoutes);

const options = {
  pfx: fs.readFileSync('sofiah_agenciah_com.pfx'),
  passphrase: process.env.PFX_PASSPHRASE
};

const port = process.env.PORT || 3007;
const server = https.createServer(options, app);

const io = socketIo(server, {
  cors: corsOptions
});

const rooms = {};
io.on('connection', (socket) => {

  // Evento para entrar na sala
  socket.on('join-room', (roomId, userId) => {

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    const otherUserSocketId = rooms[roomId].find(id => id !== socket.id);

    socket.join(roomId);

    if (!rooms[roomId].includes(socket.id)) {
        rooms[roomId].push(socket.id);
    }

    if (otherUserSocketId) {
      socket.emit('user-connected', otherUserSocketId);
    }

    socket.on('disconnect', () => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      }
      // Notifica o outro usuário que a desconexão ocorreu
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  socket.on('transcription-segment', (roomId, payload) => {
    if (!roomId || !payload || typeof payload.text !== 'string') return;

    // Sanitização mínima
    const safePayload = {
      text: String(payload.text).slice(0, 4000),
      senderRole: payload.senderRole === 'host' ? 'host' : 'guest',
      timestamp: payload.timestamp || Date.now(),
    };

    // Envia para todos na sala incluindo o emissor
    io.to(roomId).emit('transcription-segment', safePayload);
  });

  // ADICIONAR: Eventos para controle de transcrição
  socket.on('transcription-started', (roomId) => {
    if (!roomId) return;
    // Notifica outros usuários na sala que a transcrição foi iniciada
    socket.to(roomId).emit('transcription-started');
  });

  socket.on('transcription-stopped', (roomId) => {
    if (!roomId) return;
    // Notifica outros usuários na sala que a transcrição foi parada
    socket.to(roomId).emit('transcription-stopped');
  });

  // ADICIONAR: Eventos para confirmação de capacidade de transcrição do convidado
  socket.on('guest-transcription-capability', (roomId, available) => {
    if (!roomId) return;
    // Informa o host sobre a capacidade de transcrição do convidado
    socket.to(roomId).emit('guest-transcription-available', available);
  });

  socket.on('guest-transcription-confirm', (roomId, isActive) => {
    if (!roomId) return;
    // Informa o host sobre o status atual da transcrição do convidado
    socket.to(roomId).emit('guest-transcription-status', isActive);
  });

  // Eventos de sinalização WebRTC
  socket.on('offer', (targetSocketId, offer) => {
    // Encaminha a oferta para o usuário de destino
    socket.to(targetSocketId).emit('offer', socket.id, offer);
  });

  socket.on('answer', (targetSocketId, answer) => {
    // Encaminha a resposta para o usuário de destino
    socket.to(targetSocketId).emit('answer', socket.id, answer);
  });

  socket.on('ice-candidate', (targetSocketId, candidate) => {
    // Encaminha o candidato ICE para o usuário de destino
    socket.to(targetSocketId).emit('ice-candidate', socket.id, candidate);
  });

  // Evento de Chat
  socket.on('chat-message', (roomId, message) => {
    socket.to(roomId).emit('chat-message', message);
  });

  // Evento para finalizar a chamada
  socket.on('end-call', (roomId) => {
    // Notifica todos os outros na sala que a chamada terminou
    socket.to(roomId).emit('call-ended');
  });

  // Evento de desconexão (no nível correto)
  socket.on('disconnect', () => {
    // Para notificar outros, você precisaria saber de qual sala ele saiu.
    // Isso pode ser feito armazenando o roomId no objeto do socket.
    // Ex: io.emit('user-disconnected', socket.id);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server started at port ${port}`);
});