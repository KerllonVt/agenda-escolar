# Atualizações do Sistema - Agenda Escolar Interativa

## 📋 Resumo das Mudanças Implementadas

Este documento descreve as principais mudanças implementadas no sistema para atender aos novos requisitos de gestão de turmas, séries, vinculação professor-turma-matéria e o novo sistema de avaliação personalizável.

---

## 🎯 Principais Funcionalidades Adicionadas

### 1. Sistema de Gestão de Turmas e Séries (Admin)

**Componente:** `GerenciarTurmasSeries.tsx`

- ✅ Criação e edição de turmas com informações detalhadas:
  - Nome da turma (ex: "9° A", "1° B EM")
  - Série (ex: "9° Ano", "1° Ano Ensino Médio")
  - Ano letivo (ex: "2025")
  - Turno (Matutino, Vespertino, Noturno)
- ✅ Alocação de alunos em turmas específicas
- ✅ Visualização da quantidade de alunos por turma
- ✅ Validação para evitar exclusão de turmas com alunos vinculados

### 2. Vinculação Professor-Turma-Matéria (Admin)

**Componente:** `GerenciarProfessoresTurmas.tsx`

- ✅ Sistema de vinculação múltipla:
  - Um professor pode lecionar diferentes matérias em diferentes turmas
  - Ex: Prof. Pedro ensina Matemática no 9°A e Português no 9°B
- ✅ Prevenção de duplicação de vínculos
- ✅ Visualização consolidada por professor
- ✅ Gestão completa (criar e excluir vínculos)

### 3. Configuração de Sistema de Avaliação (Professor)

**Componente:** `ConfigurarAvaliacoes.tsx`

- ✅ Configuração personalizada por turma, matéria e unidade
- ✅ Tipos de avaliação disponíveis:
  - Prova
  - Teste
  - Trabalho
  - Atividade
  - Caderno
  - Outro
- ✅ Definição de pesos percentuais para cada tipo
- ✅ Validação automática: soma dos pesos deve ser 100%
- ✅ Ativação/desativação de tipos de avaliação
- ✅ Organização por unidades/bimestres (1ª a 4ª)

### 4. Lançamento de Notas (Professor)

**Componente:** `LancarNotas.tsx`

- ✅ Lançamento de notas por tipo de avaliação
- ✅ Filtros por turma, matéria, unidade e tipo
- ✅ Lançamento individual com observações
- ✅ Atualização de notas já lançadas
- ✅ Cálculo automático de médias parciais ponderadas
- ✅ Validação: notas entre 0 e 10
- ✅ Indicadores visuais de status (lançada/pendente)

### 5. Boletim do Aluno

**Componente:** `BoletimAluno.tsx`

- ✅ Visualização detalhada de notas por matéria
- ✅ Notas específicas de cada tipo de avaliação
- ✅ Pesos de cada tipo claramente exibidos
- ✅ Média parcial por unidade (ponderada)
- ✅ Média geral da matéria (média de todas as unidades)
- ✅ Média geral do aluno (todas as matérias)
- ✅ Observações do professor
- ✅ Indicadores visuais de desempenho
- ✅ Filtro por unidade/bimestre

### 6. Sistema de Atividades com Prazos

**Atualizado:** `CriarAtividade.tsx`

- ✅ Data limite de entrega
- ✅ Opção de permitir/bloquear reenvio
- ✅ Data limite de acesso (atividade fica invisível após essa data)
- ✅ Validações de datas
- ✅ Feedback visual das configurações

---

## 🗄️ Mudanças no Banco de Dados

### Tabelas Atualizadas

#### `usuarios`
```sql
- id_turma INT NULL (novo campo para alunos)
```

#### `turmas`
```sql
- nome_turma VARCHAR(50) (ex: "9° A")
- serie VARCHAR(100) (ex: "9° Ano")
- ano VARCHAR(10) (ex: "2025")
- turno VARCHAR(20) (Matutino/Vespertino/Noturno)
```

#### `atividades`
```sql
- permite_reenvio BOOLEAN DEFAULT TRUE
- data_limite_acesso DATETIME NULL
```

#### `envios_atividades`
```sql
- data_atualizacao DATETIME NULL (última atualização do envio)
```

### Novas Tabelas

#### `configuracao_avaliacao`
```sql
CREATE TABLE configuracao_avaliacao (
  id_config INT PRIMARY KEY AUTO_INCREMENT,
  id_professor INT NOT NULL,
  id_turma INT NOT NULL,
  id_materia INT NOT NULL,
  unidade INT NOT NULL, -- 1, 2, 3, 4
  tipo_avaliacao ENUM('prova', 'teste', 'trabalho', 'atividade', 'caderno', 'outro'),
  peso INT NOT NULL, -- 0-100
  ativo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (id_professor) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma),
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);
```

#### `notas_avaliacao`
```sql
CREATE TABLE notas_avaliacao (
  id_nota INT PRIMARY KEY AUTO_INCREMENT,
  id_aluno INT NOT NULL,
  id_professor INT NOT NULL,
  id_turma INT NOT NULL,
  id_materia INT NOT NULL,
  unidade INT NOT NULL,
  tipo_avaliacao ENUM('prova', 'teste', 'trabalho', 'atividade', 'caderno', 'outro'),
  nota DECIMAL(4,2) NOT NULL, -- 0.00 a 10.00
  data_lancamento DATE NOT NULL,
  observacao TEXT NULL,
  FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_professor) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma),
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);
```

---

## 🔄 Fluxo de Trabalho

### Para o Administrador:

1. **Gerenciar Turmas e Séries** → Criar turmas (9°A, 9°B, etc.)
2. **Alocar Alunos** → Vincular cada aluno a uma turma
3. **Vincular Professores** → Definir qual professor leciona qual matéria em qual turma

### Para o Professor:

1. **Configurar Avaliações** → Definir tipos e pesos por turma/matéria/unidade
2. **Criar Atividades** → Definir prazos e permitir reenvios
3. **Lançar Notas** → Registrar notas por tipo de avaliação
4. O sistema calcula automaticamente as médias ponderadas

### Para o Aluno:

1. **Ver Boletim** → Acessar notas detalhadas
2. **Acompanhar Médias** → Ver média por unidade e média geral
3. **Enviar Atividades** → Respeitar prazos e reenviar se permitido

---

## 🎨 Interface do Usuário

### Novos Cards no Dashboard

**Professor:**
- "Configurar Avaliações" (ícone Settings, cor índigo)
- "Lançar Notas" (ícone BookCheck, cor rosa)

**Aluno:**
- "Meu Boletim" (ícone TrendingUp, cor amarela)

### Novas Abas no Painel Admin

- "Gestão Turmas" (ícone GraduationCap)
- "Prof-Turmas" (ícone UserCheck)

---

## ✅ Validações Implementadas

1. **Pesos de Avaliação:** Soma deve ser exatamente 100% por turma/matéria/unidade
2. **Notas:** Devem estar entre 0 e 10
3. **Datas:** Data limite de acesso deve ser posterior à data de entrega
4. **Vínculos:** Não permite duplicação de professor-turma-matéria
5. **Exclusão de Turmas:** Só permite se não houver alunos vinculados

---

## 🔐 Controle de Acesso

- **Admin:** Acesso total a gestão de turmas e vínculos
- **Professor:** Só pode configurar avaliações e lançar notas nas turmas/matérias que leciona
- **Aluno:** Só vê suas próprias notas e da sua turma

---

## 📊 Cálculos Automáticos

### Média Parcial (por unidade):
```
Média = (Nota1 × Peso1% + Nota2 × Peso2% + ...) / (Peso1% + Peso2% + ...)
```

### Média Geral da Matéria:
```
Média = (Média Unidade 1 + Média Unidade 2 + Média Unidade 3 + Média Unidade 4) / 4
```

### Média Geral do Aluno:
```
Média = Soma das médias gerais de todas as matérias / Número de matérias
```

---

## 🚀 Próximos Passos

Para implementar no backend PHP/MySQL:

1. Criar as novas tabelas no banco de dados
2. Desenvolver APIs REST para:
   - CRUD de turmas
   - Alocação de alunos
   - Vínculos professor-turma-matéria
   - Configuração de avaliações
   - Lançamento de notas
   - Consulta de boletim
3. Implementar cálculos de médias no backend
4. Adicionar sistema de notificações em tempo real
5. Criar relatórios consolidados para professores e administradores

---

## 📝 Notas Importantes

- Todos os componentes utilizam dados mockados (exemplo) no frontend
- O sistema está preparado para integração com backend via API REST
- As interfaces foram desenvolvidas seguindo o padrão do sistema existente
- Todas as validações estão implementadas no frontend e devem ser replicadas no backend
- O design é responsivo e funciona em desktop e mobile

---

**Data da Atualização:** 11 de Novembro de 2025
**Versão:** 2.0
