// src/components/MateriaisAula.tsx

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, File, Video, Link as LinkIcon, Download, Eye, Plus, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Aula, Material, TipoMaterial } from '../types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// URL da API (local)
const API_URL = '/api';

interface MateriaisAulaProps {
  aula: Aula; 
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function MateriaisAula({ aula, onBack }: MateriaisAulaProps) {
  const { usuario, token } = useAuth();
  
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dialogAberto, setDialogAberto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState({
    tipo: 'pdf' as TipoMaterial,
    descricao: '',
    link: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const onModalOpenChange = (isOpen: boolean) => {
    setDialogAberto(isOpen);
    if (!isOpen) {
      setNovoMaterial({ tipo: 'pdf', descricao: '', link: '' });
      setSelectedFile(null);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); }
  };

  const fetchMateriais = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/materiais?aulaId=${aula.id_aula}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar materiais.');
      setMateriais(await response.json());
    } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (token) fetchMateriais(); }, [token, aula.id_aula]);

  const salvarMaterialNoBanco = async (url: string, tipo: TipoMaterial, descricao: string) => {
    try {
      const response = await fetch(`${API_URL}/materiais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id_aula: aula.id_aula,
          tipo_material: tipo,
          caminho_arquivo: url,
          descricao: descricao
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMateriais([...materiais, data]); 
      toast.success('Material salvo com sucesso!');
    } catch (error: any) { toast.error(`Erro ao salvar no banco: ${error.message}`); }
  };

  const handleUpload = async () => {
    const { tipo, descricao, link } = novoMaterial;
    setIsUploading(true);
    if (tipo === 'link') {
      if (!link.startsWith('http')) { toast.error('Insira um link válido (com http:// ou https://)'); setIsUploading(false); return; }
      const finalDescricao = descricao.trim() || link;
      await salvarMaterialNoBanco(link, 'link', finalDescricao);
      onModalOpenChange(false); setIsUploading(false);
      return;
    }
    const file = selectedFile;
    if (!file) { toast.error('Selecione um arquivo.'); setIsUploading(false); return; }
    const finalDescricao = descricao.trim() || file.name;
    if (file.size > 50 * 1024 * 1024) { toast.error('Arquivo muito grande! O limite é de 50MB.'); setIsUploading(false); return; }
    try {
      const base64Data = await fileToBase64(file);
      const pathname = `materiais/aula_${aula.id_aula}/${file.name}`;
      const response = await fetch(`${API_URL}/upload/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ filename: pathname, data: base64Data, contentType: file.type }),
      });
      const blob = await response.json();
      if (!response.ok) throw new Error(blob.error || 'Falha no upload');
      await salvarMaterialNoBanco(blob.url, tipo, finalDescricao);
      onModalOpenChange(false); setIsUploading(false);
    } catch (error: any) { toast.error(`Falha no upload: ${error.message}`); setIsUploading(false); }
  };
  
  // --- FUNÇÃO DELETE ADICIONADA ---
  const handleDeleteMaterial = async (material: Material) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${material.descricao}"?`)) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/materiais/${material.id_material}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success('Material excluído com sucesso!');
      // Remove da lista no frontend
      setMateriais(materiais.filter(m => m.id_material !== material.id_material));
      
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const getIconByType = (tipo: TipoMaterial) => {
    switch (tipo) {
      case 'vídeo': return <Video className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };
  const getColorByType = (tipo: TipoMaterial) => {
    switch (tipo) {
      case 'vídeo': return 'bg-red-100 text-red-700';
      case 'pdf': return 'bg-blue-100 text-blue-700';
      case 'link': return 'bg-purple-100 text-purple-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1"><h1 className="text-primary">Materiais da Aula</h1><p className="text-sm text-muted-foreground">{aula.assunto}</p></div>
            {usuario?.tipo_usuario === 'professor' && (
              <Dialog open={dialogAberto} onOpenChange={onModalOpenChange}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Novo Material</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Tipo de Material</Label><Select value={novoMaterial.tipo} onValueChange={(v: TipoMaterial) => setNovoMaterial({...novoMaterial, tipo: v, link: ''})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="vídeo">Vídeo</SelectItem><SelectItem value="link">Link Externo</SelectItem><SelectItem value="texto">Documento (DOCX, TXT)</SelectItem></SelectContent></Select></div>
                    <div><Label>Descrição (Opcional)</Label><Input placeholder="Ex: Apostila Capítulo 5 (se vazio, usa o nome do arquivo)" value={novoMaterial.descricao} onChange={(e) => setNovoMaterial({...novoMaterial, descricao: e.target.value})} /></div>
                    {novoMaterial.tipo === 'link' ? (<div><Label>URL (Link) *</Label><Input placeholder="https://youtube.com/..." value={novoMaterial.link} onChange={(e) => setNovoMaterial({...novoMaterial, link: e.target.value})} /></div>) : (<div><Label>Arquivo *</Label><Input type="file" onChange={handleFileChange} /></div>)}
                    <Button onClick={handleUpload} disabled={isUploading} className="w-full">{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}Salvar Material</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>)}
        {!isLoading && materiais.length > 0 && (
          <div className="space-y-4">{materiais.map((material) => (
            <Card key={material.id_material}><CardHeader><div className="flex items-start gap-4"><div className={`${getColorByType(material.tipo_material)} p-3 rounded-lg`}>{getIconByType(material.tipo_material)}</div><div className="flex-1"><Badge variant="secondary">{material.tipo_material}</Badge><CardTitle className="text-lg mt-2">{material.descricao}</CardTitle>{material.tipo_material === 'link' && (<CardDescription className="mt-2 truncate">{material.caminho_arquivo}</CardDescription>)}</div></div></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => window.open(material.caminho_arquivo, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />{material.tipo_material === 'link' ? 'Abrir Link' : 'Visualizar/Baixar'}
                  </Button>
                  {/* --- BOTÃO DELETE ADICIONADO --- */}
                  {usuario?.tipo_usuario === 'professor' && (
                    <Button variant="outline" size="icon" onClick={() => handleDeleteMaterial(material)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}</div>
        )}
        {!isLoading && materiais.length === 0 && (
          <Card><CardContent className="py-12 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground mb-4">Nenhum material disponível para esta aula</p></CardContent></Card>
        )}
      </main>
    </div>
  );
}