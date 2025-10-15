const db = require('./db');
const fs = require('fs');
const path = require('path');

async function createMeetingFilesTable() {
  try {
    console.log('Criando tabela meeting_files...');
    
    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'meeting_files'
      );
    `;
    
    const { rows } = await db.query(checkTableQuery);
    const tableExists = rows[0].exists;
    
    if (tableExists) {
      console.log('Tabela meeting_files já existe!');
      return;
    }
    
    // Criar a tabela
    const createTableQuery = `
      CREATE TABLE meeting_files (
        id SERIAL PRIMARY KEY,
        meeting_id VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await db.query(createTableQuery);
    
    // Criar índices
    await db.query('CREATE INDEX idx_meeting_files_meeting_id ON meeting_files(meeting_id);');
    await db.query('CREATE INDEX idx_meeting_files_uploaded_at ON meeting_files(uploaded_at);');
    
    console.log('Tabela meeting_files criada com sucesso!');
    console.log('Índices criados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela meeting_files:', error);
    throw error;
  }
}

// Executar se o script for chamado diretamente
if (require.main === module) {
  createMeetingFilesTable()
    .then(() => {
      console.log('Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar script:', error);
      process.exit(1);
    });
}

module.exports = { createMeetingFilesTable };
