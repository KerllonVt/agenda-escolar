// src/components/DesempenhoAluno.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ClipboardList, Award, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

// Tipos de dados para esta tela
type AtividadeSomatorio = {
  descricao: string;
  nota: number;
  valor_maximo: number;
};
type UnidadeSomatorio = {
  unidade: number;
  soma_notas: number;
  soma_valor_maximo: number;
  atividades: AtividadeSomatorio[];
};
type MateriaSomatorio = {
  id_materia: number;
  nome_materia: string;
  unidades: UnidadeSomatorio[];
};

export default function DesempenhoAluno() {
  const { token } = useAuth();
  
  const [desempenho, setDesempenho] = useState<MateriaSomatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(1);

  useEffect(() => {
    const fetchDesempenho = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/desempenho/meu`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar desempenho.');
        const data = await response.json();
        setDesempenho(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchDesempenho();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Unidade */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <p>Selecionar Unidade:</p>
            <Select
              value={unidadeSelecionada.toString()}
              onValueChange={(value: string) => setUnidadeSelecionada(Number(value))}
            >
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1ª Unidade</SelectItem>
                <SelectItem value="2">2ª Unidade</SelectItem>
                <SelectItem value="3">3ª Unidade</SelectItem>
                <SelectItem value="4">4ª Unidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notas por Matéria */}
      {desempenho.map((materia) => {
        const unidade = materia.unidades.find(u => u.unidade === unidadeSelecionada);
        if (!unidade) return null; // Não mostra a matéria se não há notas para a unidade

        return (
          <Card key={materia.id_materia}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{materia.nome_materia}</CardTitle>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total da Unidade</p>
                  <Badge variant="default" className="text-lg">
                    {unidade.soma_notas} / {unidade.soma_valor_maximo} pontos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atividade / Trabalho</TableHead>
                    <TableHead className="text-right">Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidade.atividades.map((at, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{at.descricao}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={at.nota >= (at.valor_maximo * 0.7) ? "default" : "secondary"}>
                          {at.nota} / {at.valor_maximo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Linha do Somatório */}
                  <TableRow className="bg-muted font-medium">
                    <TableCell>Total (Somatório)</TableCell>
                    <TableCell className="text-right">
                      {unidade.soma_notas} / {unidade.soma_valor_maximo}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}