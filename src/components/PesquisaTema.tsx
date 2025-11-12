import { ArrowLeft, Search, BookOpen, Video, FileText, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface PesquisaTemaProps {
  onBack: () => void;
}

export function PesquisaTema({ onBack }: PesquisaTemaProps) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  const temasSugeridos = [
    'Funções Quadráticas',
    'Segunda Guerra Mundial',
    'Fotossíntese',
    'Análise Sintática',
    'Equações de Primeiro Grau',
    'Revolução Industrial'
  ];

  const handleBuscar = (termo: string) => {
    setBusca(termo);
    setBuscando(true);

    // Gera links dinâmicos para sites externos
    setTimeout(() => {
      const termoEncoded = encodeURIComponent(termo);
      
      setResultados([
        {
          id: 1,
          titulo: `Resumo sobre ${termo}`,
          descricao: `Um guia rápido sobre ${termo} com explicações detalhadas e exemplos práticos para facilitar o aprendizado.`,
          tipo: 'resumo',
          conteudo: `${termo} é um conceito importante que permite compreender diversos aspectos relacionados ao tema. Neste material, você encontrará uma explicação clara e objetiva sobre os principais pontos e aplicações práticas.`,
          link: `https://scholar.google.com/scholar?q=${termoEncoded}`
        },
        {
          id: 2,
          titulo: `Vídeos sobre ${termo}`,
          descricao: 'Videoaulas didáticas com exemplos práticos e exercícios resolvidos',
          tipo: 'video',
          link: `https://www.youtube.com/results?search_query=${termoEncoded}`
        },
        {
          id: 3,
          titulo: `Material em PDF sobre ${termo}`,
          descricao: 'Apostilas, artigos e materiais de estudo em formato PDF',
          tipo: 'pdf',
          link: `https://www.google.com/search?q=${termoEncoded}+filetype:pdf`
        }
      ]);
      setBuscando(false);
    }, 800);
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
            <div>
              <h1 className="text-primary">Pesquisar Tema</h1>
              <p className="text-sm text-muted-foreground">
                Busque conteúdos educativos sobre qualquer assunto
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Busca */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Digite o tema que deseja estudar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && busca && handleBuscar(busca)}
                  className="pl-10 h-12"
                />
              </div>
              <Button
                size="lg"
                onClick={() => busca && handleBuscar(busca)}
                disabled={!busca || buscando}
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Temas Sugeridos */}
        {resultados.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Temas Sugeridos</CardTitle>
              <CardDescription>
                Clique em um tema para buscar conteúdos relacionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {temasSugeridos.map((tema) => (
                  <Badge
                    key={tema}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
                    onClick={() => handleBuscar(tema)}
                  >
                    {tema}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Busca */}
        {buscando && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Buscando conteúdos...</p>
          </div>
        )}

        {!buscando && resultados.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground">
                Resultados para "{busca}"
              </h2>
              <Button variant="outline" onClick={() => setResultados([])}>
                Nova Busca
              </Button>
            </div>

            {resultados.map((resultado) => (
              <Card key={resultado.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      resultado.tipo === 'resumo' ? 'bg-blue-100 text-blue-700' :
                      resultado.tipo === 'video' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {resultado.tipo === 'resumo' && <BookOpen className="w-6 h-6" />}
                      {resultado.tipo === 'video' && <Video className="w-6 h-6" />}
                      {resultado.tipo === 'pdf' && <FileText className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {resultado.tipo === 'resumo' ? 'Resumo' :
                           resultado.tipo === 'video' ? 'Vídeo' : 'PDF'}
                        </Badge>
                      </div>
                      <CardTitle>{resultado.titulo}</CardTitle>
                      <CardDescription className="mt-2">
                        {resultado.descricao}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {resultado.tipo === 'resumo' ? (
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm">{resultado.conteudo}</p>
                    </div>
                  ) : null}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(resultado.link, '_blank')}
                  >
                    {resultado.tipo === 'video' && (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Buscar Vídeos no YouTube
                      </>
                    )}
                    {resultado.tipo === 'pdf' && (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Buscar PDFs no Google
                      </>
                    )}
                    {resultado.tipo === 'resumo' && (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Buscar no Google Acadêmico
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
