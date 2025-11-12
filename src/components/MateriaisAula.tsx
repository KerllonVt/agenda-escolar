import { ArrowLeft, FileText, Video, File, Link as LinkIcon, Download, Eye, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { materiaisAula, agendas, professorTurmaMateria, materias } from '../lib/mock-data';

interface MateriaisAulaProps {
  agendaId: number;
  onBack: () => void;
}

export function MateriaisAula({ agendaId, onBack }: MateriaisAulaProps) {
  const { usuario } = useAuth();
  
  const agenda = agendas.find(a => a.id === agendaId);
  const materiais = materiaisAula.filter(m => m.id_agenda === agendaId);
  
  const ptm = professorTurmaMateria.find(p => p.id === agenda?.id_ptm);
  const materia = materias.find(m => m.id === ptm?.id_materia);

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'vídeo':
        return <Video className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'documento':
        return <File className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case 'vídeo':
        return 'bg-red-100 text-red-700';
      case 'pdf':
        return 'bg-blue-100 text-blue-700';
      case 'documento':
        return 'bg-green-100 text-green-700';
      case 'link':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-primary">Materiais da Aula</h1>
              <p className="text-sm text-muted-foreground">
                {materia?.nome_materia} - {agenda?.assunto}
              </p>
            </div>
            {usuario?.tipo === 'professor' && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Material
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {materiais.length > 0 ? (
          <div className="space-y-4">
            {materiais.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`${getColorByType(material.tipo)} p-3 rounded-lg`}>
                        {getIconByType(material.tipo)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{material.tipo}</Badge>
                        </div>
                        <CardTitle className="text-lg">{material.descricao}</CardTitle>
                        {material.tipo === 'link' && (
                          <CardDescription className="mt-2">
                            {material.caminho}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {material.tipo === 'link' ? (
                      <Button variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Abrir Link
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum material disponível para esta aula
              </p>
              {usuario?.tipo === 'professor' && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Material
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
