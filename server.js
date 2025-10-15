io.on('connection', (socket) => {
  // ...existing code...

  // Garanta que o join-room coloca o socket na sala
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    // ...existing code...
  });

  // ADICIONE: relay da transcrição do convidado para o host
  socket.on('transcription-segment', (roomId, payload) => {
    if (!roomId || !payload || typeof payload.text !== 'string') return;

    // Sanitização mínima
    const safePayload = {
      text: String(payload.text).slice(0, 4000),
      senderRole: payload.senderRole === 'host' ? 'host' : 'guest',
      timestamp: payload.timestamp || Date.now(),
    };

    // Envia para todos na sala exceto o emissor (host verá)
    socket.to(roomId).emit('transcription-segment', safePayload);

    // Se quiser que o emissor também receba (para debug), use:
    // io.to(roomId).emit('transcription-segment', safePayload);
  });

  // ...existing code...
});