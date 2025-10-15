const axios = require('axios');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

function cleanPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const startsWithCountryCode = cleaned.startsWith('55');
  const numberWithCountryCode = startsWithCountryCode ? cleaned : '55' + cleaned;
  return numberWithCountryCode;
}

// AGENDA
exports.createEvent = async (req, res) => {
  const { calendar_type, start_time, end_time, description, calendar_date, id_provider, id_user, status } = req.body;
  const type = (calendar_type === 'Sessão Remota') ? 0 : ((calendar_type === 'Sessão Presencial') ? 1 : 2);
  try {
    const { rowsFound } = await db.query(`
      SELECT id
        FROM calendar
        WHERE calendar_date = $1 AND start_time = $2 AND id_provider = $3`,
      [calendar_date, start_time, id_provider]);
    if (rowsFound && rowsFound.length > 0) {
      throw new Error('Evento já existe para este horário.');
    }

    const createdAt = new Date();
    const { rows } = await db.query(
      `INSERT INTO calendar
        (calendar_type, start_time, end_time, description, calendar_date, status, id_provider, id_user, created_at, origem, prontuario)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, '')
        RETURNING *`,
      [type, start_time, end_time, description, calendar_date, status, id_provider, id_user, createdAt]
    );
    rows[0].calendar_type = (rows[0].calendar_type === 0) ? 'Sessão Remota' : ((rows[0].calendar_type === 1) ? 'Sessão Presencial' : 'Bloqueado');
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

exports.deleteOneEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM calendar WHERE id = $1', [id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteDayEvent = async (req, res) => {
  const { id, date } = req.params;
  try {
    await db.query('DELETE FROM calendar WHERE id_provider = $1 AND calendar_date = $2', [id, date]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteGroupEvent = async (req, res) => {
  const { date, startTime, endTime, provider } = req.params;
  const startTimeFormatted = startTime.substring(0, 5).replace(':', '');
  const endTimeFormatted = endTime.substring(0, 5).replace(':', '');

  try {
    const { rowCount } = await db.query(
      `DELETE FROM calendar
        WHERE id_provider = $4
        AND calendar_date = $1
        AND CAST(REPLACE(TO_CHAR(start_time, 'HH24:MI'), ':', '') AS INTEGER) BETWEEN $2 AND $3`,
      [date, parseInt(startTimeFormatted), parseInt(endTimeFormatted), provider]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getEventsByDate = async (req, res) => {
  const { date, provider } = req.params;
  try {
    const { rows } = await db.query(`
      'SELECT
        id,
        CASE
          WHEN calendar_type = 0 THEN 'Sessão Remota'
          WHEN calendar_type = 1 THEN 'Sessão Presencial'
          WHEN calendar_type = 2 THEN 'Bloqueado'
        END AS calendar_type,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        description,
        TO_CHAR(calendar_date, 'yyyy-MM-dd') AS calendar_date,
        id_user,
        origem,
        status
      FROM calendar
      WHERE calendar_date = $1 AND provider_id = $2
      ORDER BY start_time'`,
      [date, provider]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getEventsByDateRange = async (req, res) => {
  const { startDate, endDate, provider } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        CASE
          WHEN calendar_type = 0 THEN 'Sessão Remota'
          WHEN calendar_type = 1 THEN 'Sessão Presencial'
          WHEN calendar_type = 2 THEN 'Bloqueado'
        END AS calendar_type,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        description,
        TO_CHAR(calendar_date, 'yyyy-MM-dd') AS calendar_date,
        id_user,
        origem,
        status
      FROM calendar
      WHERE calendar_date >= $1 AND calendar_date <= $2 AND id_provider = $3
      ORDER BY calendar_date, start_time`,
      [startDate, endDate, provider]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateEventStatus = async (req, res) => {
  const { id, status } = req.body;
  try {
    await db.query('UPDATE calendar SET status = $2 WHERE id = $1', [id, status]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// MEETING
exports.createMeeting = async (req, res) => {
  const { hostId, userId, calendarId } = req.body;
  const meetingId = uuidv4(); // Gera um ID único para a reunião
  const meetingLink = `${process.env.FRONTEND_URL}/meet/${meetingId}`;

  try {
    const createdAt = new Date();
    const { rows } = await db.query(
      `INSERT INTO meetings
        (meeting_id, calendar_id, host_id, user_id, meeting_link, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 0)
        RETURNING *`,
      [meetingId, calendarId, hostId, userId, meetingLink, createdAt]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar reunião:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMeeting = async (req, res) => {
  const { meetingId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT * FROM meetings WHERE meeting_id = $1`,
      [meetingId]
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ error: 'Meeting not found' });
    }
  } catch (err) {
    console.error('Erro ao buscar reunião:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMeetingById = async (req, res) => {
  const { idCalendar } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT * FROM meetings WHERE calendar_id = $1`,
      [idCalendar]
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ error: 'Meeting not found' });
    }
  } catch (err) {
    console.error('Erro ao buscar reunião:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTranscription = async (req, res) => {
  const { meetingId, transcription } = req.body;

  try {
    await db.query(`UPDATE meetings SET transcription = $2 WHERE meeting_id = $1`,
      [meetingId, transcription]
    );
    res.status(204).end();
  } catch (err) {
    console.error('Erro ao atualizar reunião:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMeetingStatus = async (req, res) => {
  const { meetingId, status } = req.body;

  try {
    await db.query(`UPDATE meetings SET status = $2 WHERE meeting_id = $1`,
      [meetingId, status]
    );
    res.status(204).end();
  } catch (err) {
    console.error('Erro ao atualizar reunião:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Configuração específica do multer para upload de arquivos de reunião
const meetingFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const path = require('path');
    // Caminho correto para a pasta public do Next.js (um nível acima do backend)
    const uploadsDir = path.join(__dirname, '../public/uploads/meetings');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `meeting-${uniqueSuffix}-${sanitizedName}`);
  }
});

const meetingFileUpload = multer({ 
  storage: meetingFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Permitir apenas certos tipos de arquivo
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
}).single('file');

exports.uploadMeetingFile = async (req, res) => {
  meetingFileUpload(req, res, async function (err) {
    if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const { meetingId } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID é obrigatório' });
    }

    try {
      // Verificar se a reunião existe
      const { rows: meetingRows } = await db.query(
        'SELECT * FROM meetings WHERE meeting_id = $1',
        [meetingId]
      );

      if (meetingRows.length === 0) {
        return res.status(404).json({ error: 'Reunião não encontrada' });
      }

      // Gerar URL do arquivo - usar a rota da API do Next.js
      const fileUrl = `${process.env.FRONTEND_URL}/uploads/meetings/${req.file.filename}`;
      
      // Salvar informações do arquivo no banco de dados
      const { rows } = await db.query(
        `INSERT INTO meeting_files 
         (meeting_id, filename, original_name, file_path, file_url, file_size, mime_type, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          meetingId,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          fileUrl,
          req.file.size,
          req.file.mimetype,
          new Date()
        ]
      );

      res.status(200).json({
        message: 'Arquivo enviado com sucesso',
        file: rows[0],
        url: fileUrl
      });

    } catch (dbErr) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
};

// PRONTUARIO
exports.getProntuarioByContact = async (req, res) => {
  const { sender, provider } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        prontuario,
        (calendar_date + start_time) AS time_server
      FROM calendar
      WHERE id_user = $1 AND id_provider = $2
      ORDER BY (calendar_date + start_time)`,
      [sender, provider]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProntuario = async (req, res) => {
  const { id, prontuario } = req.body;
  try {
    await db.query('UPDATE calendar SET prontuario = $2 WHERE id = $1', [id, prontuario]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// FINANCEIRO
exports.createFinance = async (req, res) => {
  const { id_provider, id_user, payment_date, payment_value, payment_type, user_name } = req.body;
  try {
    const createdAt = new Date();
    const { rows } = await db.query(
      `INSERT INTO finance
        (id_provider, id_user, payment_date, payment_value, payment_type, user_name, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
        RETURNING *`,
      [id_provider, id_user, payment_date, payment_value, payment_type, user_name, createdAt]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOneFinance = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM finance WHERE id = $1', [id]);''
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFinanceByDateRange = async (req, res) => {
  const { client, startDate, endDate, provider } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        id_provider,
        id_user,
        payment_date,
        payment_value,
        payment_type,
        CASE
          WHEN payment_type = 0 THEN 'Cartão Crédito'
          WHEN payment_type = 1 THEN 'Cartão Débito'
          WHEN payment_type = 2 THEN 'Pix'
          WHEN payment_type = 3 THEN 'Boleto'
          WHEN payment_type = 4 THEN 'Dinheiro'
        END AS payment_type_name,
        user_name,
        status
      FROM finance
      WHERE
        payment_date >= $2 AND payment_date <= $3
        AND ($1::text = 'vazio' OR user_name ILIKE '%' || $1::text || '%')
        AND id_provider = $4
      ORDER BY payment_date, id`,
      [client, startDate, endDate, provider]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFinanceStatus = async (req, res) => {
  const { id, status } = req.body;
  try {
    await db.query('UPDATE finance SET status = $2 WHERE id = $1', [id, status]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// MENSAGENS
exports.getMessagesByContact = async (req, res) => {
  const { sender, provider } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        CASE
          WHEN is_sent = true THEN (SELECT name FROM "user" where id = messages.id_user)
          ELSE 'SofiahPsi'
        END AS name,
        message,
        time_server,
        is_sent
      FROM messages
      WHERE id_user = $1 AND id_provider = $2
      ORDER BY time_server`,
      [sender, provider]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getContacts = async (req, res) => {
  const { provider } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        CASE 
            WHEN name IS NULL THEN phone
            ELSE name
        END AS name,
        birthday,
        gender,
        phone,
        anamnesis,
        anamnesis_analysis
      FROM "user"
      WHERE id_provider = $1`,
      [provider]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        CASE 
            WHEN name IS NULL THEN phone
            ELSE name
        END AS name,
        birthday,
        gender,
        phone,
        anamnesis,
        anamnesis_analysis
      FROM "user"
      WHERE id = $1`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetContact = async (req, res) => {
  const { contact } = req.params;
  try {
    const { rows } = await db.query(`UPDATE "user" SET id_provider = 0 WHERE id = $1 RETURNING *`, [contact]);
    res.status(202).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addContact = async (req, res) => {
  const { contact, name, birthdate, gender, provider } = req.body;
  try {
    const phoneNumber = cleanPhoneNumber(contact);
    const { rows } = await db.query(`SELECT id_provider FROM "user" WHERE phone = $1 AND id_provider > 0`, [phoneNumber]);
    if (rows.length > 0) {
      return res.status(404).json({ error: 'User already other provider' });
    } else {
      const { rows } = await db.query(`SELECT id_provider FROM "user" WHERE phone = $1`, [phoneNumber]);
      if (rows.length > 0) {
          const { rows } = await db.query(`UPDATE "user" SET
            name = $2,
            birthday = $3,
            gender = $4,
            id_provider = $5
            WHERE phone = $1 RETURNING *`,
          [phoneNumber, name, birthdate, gender, provider]);
          res.status(202).json(rows);
      } else {
        const { rows } = await db.query(
          `INSERT INTO "user"
            (phone, name, birthday, gender, id_provider)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
          [phoneNumber, name, birthdate, gender, provider]
        );
        res.status(202).json(rows);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PERFIL
exports.updateProfile = async (req, res) => {
  const { id, name, email, cep, profile, registro, formacao, publico, consultorio, atendimento_online, atendimento_presencial, preco_consulta, profile_embedding } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE provider SET
        name = $2,
        email = $3,
        cep = $4,
        profile = $5,
        registro_profissional = $6,
        formacao_profissional = $7,
        publico_atendimento = $8,
        endereco_consultorio = $9,
        atendimento_online = $10,
        atendimento_presencial = $11,
        preco_consulta = $12,
        profile_embedding = $13::float[] WHERE id = $1 RETURNING *`,
      [id, name, email, cep, profile, registro, formacao, publico, consultorio, atendimento_online, atendimento_presencial, preco_consulta, profile_embedding]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.status(202).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateModalityVector = async (req, res) => {
  const { id, modality_embedding, modality_text } = req.body;
  try {
    const { rows } = await db.query(`SELECT id_provider FROM profile_vectors WHERE id_provider = $1`, [id]);
    if (rows.length > 0) {
      await db.query(
        `UPDATE profile_vectors SET modality_embedding = $2::float[], modality_text = $3 WHERE id_provider = $1 RETURNING *`,
        [id, modality_embedding, modality_text]
      );
    } else {
      await db.query(
        `INSERT INTO profile_vectors (id_provider, modality_embedding, modality_text) VALUES ($1, $2::float[], $3) RETURNING *`,
        [id, modality_embedding, modality_text]
      );
    }
    res.status(202);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePhoto = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file' });
    }
    
    try {
      const { id, howPhoto } = req.body;
      const imageBuffer = req.file.buffer;

      const { rows } = await db.query(
        `UPDATE provider SET ${howPhoto} = $2 WHERE id = $1 RETURNING *`,
        [id, imageBuffer]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      const photo_upload = rows[0][howPhoto].toString('base64');
      res.status(202).json({ photo_upload });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM provider WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPhoto = async (req, res) => {
  const { howPhoto, id } = req.params;
  try {
    const { rows } = await db.query(`SELECT ${howPhoto} FROM provider WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    if (!rows[0][howPhoto]) {
      return res.json({ photo_upload: null });
    }
    const photo_upload = rows[0][howPhoto].toString('base64');
    res.json({ photo_upload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PROVEDOR
exports.verifyProvider = async (req, res) => {
  const { phone } = req.params;

  try {
    const phoneNumber = cleanPhoneNumber(phone);
    const { rows } = await db.query(`
      SELECT
        p.login_password,
        p.id,
        p.status,
        s.stripe_subscription_id AS subscription_id,
        s.current_period_end AS subscription_end,
        s.plan_name AS subscription_plan
      FROM provider p
      LEFT JOIN subscriptions s ON p.id = s.user_id
      WHERE p.phone = $1
      ORDER BY id DESC
      LIMIT 1`, [phoneNumber]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createSubscription = async (req, res) => {
  const { user_id, voucher_type } = req.body;
  
  try {
    const current_period_start = new Date();
    const current_period_end = new Date();
    current_period_end.setDate(current_period_end.getDate() + 30);
    const { rows } = await db.query(
      `INSERT INTO subscriptions 
        (user_id, stripe_subscription_id, plan_id, plan_name, amount, current_period_start, current_period_end, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
      [
        user_id,
        null,
        null,
        (voucher_type === 0) ? 'basic' : 'intermediate',
        0,
        current_period_start,
        current_period_end,
        "active",
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProvider = async (req, res) => {
  const { phone, name, email, cep, voucher, latitude, longitude, password } = req.body;
  console.log('Novo profissional criado:', phone, name);
  
  try {
    const phoneNumber = cleanPhoneNumber(phone);
    const { rows: rowsProvider } = await db.query('SELECT id FROM provider WHERE phone = $1', [phoneNumber]);
    if (rowsProvider.length > 0) {
      return res.status(404).json({ error: 'Telefone já cadastrado' });
    } else {
      let voucher_type = 0;
      if (voucher) {
        const { rows: rowsVoucher } = await db.query('SELECT voucher_type FROM vouchers WHERE voucher_id = $1', [voucher]);
        if (rowsVoucher.length === 0) {
          return res.status(404).json({ error: 'Cupom não localizado' });
        } else {
          voucher_type = rowsVoucher[0].voucher_type;
        }
      }
      const createdAt = new Date();
      const { rows } = await db.query(
        'INSERT INTO provider (phone, name, email, cep, voucher_id, voucher_type, location_lat, location_lon, login_password, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10) RETURNING *',
        [phoneNumber, name, email, cep, voucher, voucher_type, latitude, longitude, password, createdAt]
      );
      res.status(201).json(rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatusProvider = async (req, res) => {
  const { id, status } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE provider SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.status(202).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyTokenProvider = async (req, res) => {
  const { token } = req.params;

  try {
    const { rows } = await db.query('SELECT phone FROM provider WHERE login_password = $1', [token]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePasswordProvider = async (req, res) => {
  const { phone, password } = req.body;
  const phoneNumber = cleanPhoneNumber(phone);
  try {
    const { rows } = await db.query(
      'UPDATE provider SET login_password = $2 WHERE phone = $1 RETURNING *',
      [phoneNumber, password]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.status(202).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// MODALIDADE
exports.createModality = async (req, res) => {
  const { id_provider, id_modality, description_modality, id_category, description_category } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO provider_modality (id_provider, id_modality, description_modality, id_category, description_category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [id_provider, id_modality, description_modality, id_category, description_category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getModality = async (req, res) => {
  const { id_provider, id_category } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT * FROM provider_modality WHERE id_provider = $1 AND id_category = $2',
       [ id_provider, id_category]);
    if (rows.length === 0) {
      return res.status(204).json({ error: 'Modality not found' });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getQtyModality = async (req, res) => {
  const { id_provider, id_category } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT COUNT(*) AS qty FROM provider_modality WHERE id_provider = $1 AND id_category = $2',
       [ id_provider, id_category]);
    if (rows.length === 0) {
      return res.status(204).json({ error: 'Modality not found' });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getModalityByProvider = async (req, res) => {
  const { id_provider } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT description_modality FROM provider_modality WHERE id_provider = $1',
       [ id_provider ]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteModality = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM provider_modality WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Modality not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// EMBEDDING
exports.createEmbeddingOpenAI = async (req, res) => {
  const { embedding } = req.body;
  try {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      input: embedding,
      model: 'text-embedding-ada-002',
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const vector = response.data.data[0].embedding;
    res.json({ vector });
  } catch (error) {
      res.status(500).json({ error: 'Erro ao obter embedding' });
  }
};

// WHATSAPP SONIAH
exports.sendMessageSoniah = async (req, res) => {
  const { phone, message } = req.body;
  const phoneNumber = cleanPhoneNumber(phone);
  try {
    console.log('Mensagem da Soniah:', phoneNumber, message);
    await axios.post(`${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_SONIAH}`, {
      number: phoneNumber,
      text: message
    }, {
      headers: {
        'apikey': `${process.env.EVOLUTION_KEY_SONIAH}`,
        'Content-Type': 'application/json'
      }
    });
    res.status(204).end();
  } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

// WHATSAPP SOFIAH
exports.sendMessageSofiah = async (req, res) => {
  const { phone, message, id_provider } = req.body;
  const phoneNumber = cleanPhoneNumber(phone);
  try {
    console.log('Mensagem da Sofiah:', phoneNumber, message);
    await axios.post(`${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_SOFIAH}`, {
      number: phoneNumber,
      text: message
    }, {
      headers: {
        'apikey': `${process.env.EVOLUTION_KEY_SOFIAH}`,
        'Content-Type': 'application/json'
      }
    });
    const createdAt = new Date();
    await db.query(
      `INSERT INTO messages
        (id_user, is_sent, message, time_server, id_provider, followup_checked)
        VALUES ((select id from "user" where phone = $1), false, $2, $3, $4, false)
        RETURNING *`,
      [phoneNumber, message, createdAt, id_provider]
    );
    res.status(204).end();
  } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

// AI PROFILE
exports.askAIAgent = async (req, res) => {
  const { prompt, systemContent } = req.body;
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `${systemContent}` },
        { role: 'user', content: `${prompt}` }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Erro ao gerar AI' });
  }
};

// CEP
exports.getCoordinatesByCep = async (req, res) => {
  const { cep } = req.params;
  try {
    const response = await fetch(`${process.env.CEP_URL}/${cep}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Referer': `${process.env.CEP_KEY}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();
    const { location: { lat: latitude, lon: longitude } } = data;
    
    res.json({ latitude, longitude });
  } catch (error) {
    res.status(500).json({ error: 'CEP inválido' });
  }
};

// MEETING MESSAGES
exports.saveMeetingMessages = async (req, res) => {
  const { meetingId, messages } = req.body;
  
  try {
    let savedCount = 0;
    
    // Inserir apenas as novas mensagens, verificando duplicatas
    for (const message of messages) {
      // Verificar se a mensagem já existe no banco usando múltiplos critérios
      const { rows: existingMessages } = await db.query(
        `SELECT id FROM meeting_messages 
         WHERE meeting_id = $1 
         AND sender = $2 
         AND text = $3 
         AND timestamp = $4
         AND (attachment_name = $5 OR (attachment_name IS NULL AND $5 IS NULL))`,
        [
          meetingId,
          message.sender,
          message.text,
          message.timestamp,
          message.attachment?.name || null
        ]
      );
      
      if (existingMessages.length === 0) {
        // Mensagem não existe, inserir
        await db.query(
          `INSERT INTO meeting_messages (meeting_id, is_host, sender, text, timestamp, attachment_name, attachment_url, attachment_type, attachment_size, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            meetingId,
            message.isHost,
            message.sender,
            message.text,
            message.timestamp,
            message.attachment?.name || null,
            message.attachment?.url || null,
            message.attachment?.type || null,
            message.attachment?.size || null
          ]
        );
        savedCount++;
      }
    }
    
    res.status(200).json({ success: true, savedCount: savedCount, totalReceived: messages.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMeetingMessages = async (req, res) => {
  const { meetingId } = req.params;
  
  try {
    const { rows } = await db.query(
      `SELECT * FROM meeting_messages 
       WHERE meeting_id = $1 
       ORDER BY created_at ASC`,
      [meetingId]
    );
    
    // Formatar as mensagens para o formato esperado pelo frontend
    const messages = rows.map(row => ({
      id: row.id.toString(), // ID único do banco de dados
      isHost: row.is_host,
      sender: row.sender,
      text: row.text,
      timestamp: row.timestamp,
      isSaved: true, // Mensagens carregadas do banco já estão salvas
      attachment: row.attachment_name ? {
        name: row.attachment_name,
        url: row.attachment_url,
        type: row.attachment_type,
        size: row.attachment_size
      } : null
    }));
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};