import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Caminho para o arquivo
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'meetings', filename);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      // Vamos tentar listar o diretório para ver que arquivos existem
      try {
        await fs.readdir(path.join(process.cwd(), 'public', 'uploads', 'meetings'));
      } catch { }
      
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Ler o arquivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar o tipo MIME baseado na extensão
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
    }
    
    // Retornar o arquivo com o tipo MIME correto
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
    
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
