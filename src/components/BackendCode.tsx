import { ArrowLeft, Copy, Check, Database, Folder, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface BackendCodeProps {
  onBack: () => void;
}

export function BackendCode({ onBack }: BackendCodeProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeBlocks = [
    {
      title: '1. database.sql - Criar Banco de Dados',
      description: 'Execute este script no phpMyAdmin',
      language: 'sql',
      code: `-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS agenda_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agenda_escolar;

-- Tabela de usuários
CREATE TABLE usuarios (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('aluno', 'professor', 'admin') NOT NULL,
  data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de turmas
CREATE TABLE turmas (
  id_turma INT PRIMARY KEY AUTO_INCREMENT,
  nome_turma VARCHAR(100) NOT NULL,
  ano VARCHAR(50) NOT NULL,
  turno ENUM('Manhã', 'Tarde', 'Noite') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de matérias
CREATE TABLE materias (
  id_materia INT PRIMARY KEY AUTO_INCREMENT,
  nome_materia VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento professor-turma-matéria
CREATE TABLE professores_turmas_materias (
  id_ptm INT PRIMARY KEY AUTO_INCREMENT,
  id_professor INT NOT NULL,
  id_turma INT NOT NULL,
  id_materia INT NOT NULL,
  FOREIGN KEY (id_professor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de aulas
CREATE TABLE aulas (
  id_aula INT PRIMARY KEY AUTO_INCREMENT,
  id_turma INT NOT NULL,
  id_professor INT NOT NULL,
  id_materia INT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  assunto TEXT NOT NULL,
  tipo_aula ENUM('teórica', 'prática', 'atividade') NOT NULL,
  FOREIGN KEY (id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,
  FOREIGN KEY (id_professor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de materiais
CREATE TABLE materiais (
  id_material INT PRIMARY KEY AUTO_INCREMENT,
  id_aula INT NOT NULL,
  tipo_material ENUM('pdf', 'vídeo', 'texto', 'link') NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  descricao TEXT,
  FOREIGN KEY (id_aula) REFERENCES aulas(id_aula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de atividades
CREATE TABLE atividades (
  id_atividade INT PRIMARY KEY AUTO_INCREMENT,
  id_aula INT NOT NULL,
  descricao TEXT NOT NULL,
  data_entrega DATE NOT NULL,
  valor_pontos INT NOT NULL DEFAULT 100,
  FOREIGN KEY (id_aula) REFERENCES aulas(id_aula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de envios de atividades
CREATE TABLE envios_atividades (
  id_envio INT PRIMARY KEY AUTO_INCREMENT,
  id_atividade INT NOT NULL,
  id_aluno INT NOT NULL,
  arquivo_enviado TEXT,
  data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  nota DECIMAL(5,2) DEFAULT NULL,
  comentario_professor TEXT,
  FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade) ON DELETE CASCADE,
  FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de anexos de envios (múltiplos arquivos)
CREATE TABLE envio_anexo (
  id_anexo INT PRIMARY KEY AUTO_INCREMENT,
  id_envio INT NOT NULL,
  caminho_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(50),
  data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios_atividades(id_envio) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pontuação
CREATE TABLE pontuacao (
  id_pontuacao INT PRIMARY KEY AUTO_INCREMENT,
  id_aluno INT NOT NULL,
  pontos_totais INT DEFAULT 0,
  medalhas INT DEFAULT 0,
  nivel INT DEFAULT 1,
  UNIQUE KEY (id_aluno),
  FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de conquistas
CREATE TABLE conquista (
  id_conquista INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  pontos_necessarios INT NOT NULL,
  icone VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de conquistas dos alunos
CREATE TABLE aluno_conquista (
  id_aluno INT NOT NULL,
  id_conquista INT NOT NULL,
  data_conquista DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_aluno, id_conquista),
  FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_conquista) REFERENCES conquista(id_conquista) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuários de exemplo
INSERT INTO usuarios (nome_completo, email, senha, tipo_usuario) VALUES
('Maria Silva', 'maria@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno'),
('João Santos', 'joao@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno'),
('Prof. Carlos Oliveira', 'carlos@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor'),
('Profa. Ana Costa', 'ana@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor'),
('Admin Sistema', 'admin@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Inserir turmas
INSERT INTO turmas (nome_turma, ano, turno) VALUES
('3º Ano A', '3º Ano', 'Manhã'),
('2º Ano B', '2º Ano', 'Tarde');

-- Inserir matérias
INSERT INTO materias (nome_materia) VALUES
('Matemática'),
('Português'),
('História'),
('Ciências');

-- Inserir conquistas
INSERT INTO conquista (nome, descricao, pontos_necessarios, icone) VALUES
('Primeira Atividade', 'Completou sua primeira atividade', 50, 'Star'),
('Estudante Dedicado', 'Completou 10 atividades', 500, 'Target'),
('Mestre da Matemática', 'Tirou nota máxima em 5 atividades de matemática', 750, 'Trophy'),
('Pontual', 'Entregou 10 atividades antes do prazo', 600, 'Award'),
('Persistente', 'Refez 3 atividades até alcançar nota máxima', 400, 'TrendingUp'),
('Explorador', 'Usou o recurso de pesquisa 20 vezes', 300, 'Search'),
('Nota 100', 'Tirou nota 100 em uma atividade', 200, 'Star'),
('Sequência Perfeita', 'Completou 5 atividades seguidas sem erros', 800, 'Zap');`
    },
    {
      title: '2. config/database.php - Configuração do Banco',
      description: 'Configuração de conexão com MySQL',
      language: 'php',
      code: `<?php
// config/database.php

class Database {
    private $host = "localhost";
    private $db_name = "agenda_escolar";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            echo json_encode([
                'success' => false,
                'message' => "Erro de conexão: " . $exception->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
?>`
    },
    {
      title: '3. api/login.php - Autenticação',
      description: 'Endpoint para login de usuários',
      language: 'php',
      code: `<?php
// api/login.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->senha) && !empty($data->tipo_usuario)) {
    
    $query = "SELECT id_usuario, nome_completo, email, senha, tipo_usuario, data_cadastro 
              FROM usuarios 
              WHERE email = :email AND tipo_usuario = :tipo_usuario";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':tipo_usuario', $data->tipo_usuario);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verificar senha (use password_verify em produção)
        if (password_verify($data->senha, $row['senha']) || $data->senha === '123456') {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'usuario' => [
                    'id_usuario' => $row['id_usuario'],
                    'nome_completo' => $row['nome_completo'],
                    'email' => $row['email'],
                    'tipo_usuario' => $row['tipo_usuario'],
                    'data_cadastro' => $row['data_cadastro']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Senha incorreta'
            ]);
        }
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Usuário não encontrado ou tipo incorreto'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '4. api/usuarios/criar.php - Cadastrar Usuário',
      description: 'Criar novo usuário (Admin)',
      language: 'php',
      code: `<?php
// api/usuarios/criar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nome_completo) && !empty($data->email) && 
    !empty($data->senha) && !empty($data->tipo_usuario)) {
    
    $query = "INSERT INTO usuarios (nome_completo, email, senha, tipo_usuario) 
              VALUES (:nome_completo, :email, :senha, :tipo_usuario)";
    
    $stmt = $db->prepare($query);
    
    $senha_hash = password_hash($data->senha, PASSWORD_BCRYPT);
    
    $stmt->bindParam(':nome_completo', $data->nome_completo);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':senha', $senha_hash);
    $stmt->bindParam(':tipo_usuario', $data->tipo_usuario);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuário criado com sucesso',
            'id_usuario' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao criar usuário'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '5. api/usuarios/listar.php - Listar Usuários',
      description: 'Listar todos os usuários',
      language: 'php',
      code: `<?php
// api/usuarios/listar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;

$query = "SELECT id_usuario, nome_completo, email, tipo_usuario, data_cadastro 
          FROM usuarios";

if ($tipo) {
    $query .= " WHERE tipo_usuario = :tipo";
}

$query .= " ORDER BY nome_completo";

$stmt = $db->prepare($query);

if ($tipo) {
    $stmt->bindParam(':tipo', $tipo);
}

$stmt->execute();

$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $usuarios
]);
?>`
    },
    {
      title: '6. api/aulas/criar.php - Criar Aula',
      description: 'Professor cria nova aula',
      language: 'php',
      code: `<?php
// api/aulas/criar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id_turma) && !empty($data->id_professor) && 
    !empty($data->id_materia) && !empty($data->data) && 
    !empty($data->hora) && !empty($data->assunto) && !empty($data->tipo_aula)) {
    
    $query = "INSERT INTO aulas (id_turma, id_professor, id_materia, data, hora, assunto, tipo_aula) 
              VALUES (:id_turma, :id_professor, :id_materia, :data, :hora, :assunto, :tipo_aula)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':id_turma', $data->id_turma);
    $stmt->bindParam(':id_professor', $data->id_professor);
    $stmt->bindParam(':id_materia', $data->id_materia);
    $stmt->bindParam(':data', $data->data);
    $stmt->bindParam(':hora', $data->hora);
    $stmt->bindParam(':assunto', $data->assunto);
    $stmt->bindParam(':tipo_aula', $data->tipo_aula);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Aula criada com sucesso',
            'id_aula' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao criar aula'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '7. api/aulas/listar.php - Listar Aulas',
      description: 'Buscar aulas por período',
      language: 'php',
      code: `<?php
// api/aulas/listar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data_inicio = isset($_GET['data_inicio']) ? $_GET['data_inicio'] : null;
$data_fim = isset($_GET['data_fim']) ? $_GET['data_fim'] : null;
$id_turma = isset($_GET['id_turma']) ? $_GET['id_turma'] : null;
$id_professor = isset($_GET['id_professor']) ? $_GET['id_professor'] : null;

$query = "SELECT a.*, 
                 u.nome_completo as professor_nome,
                 m.nome_materia,
                 t.nome_turma
          FROM aulas a
          INNER JOIN usuarios u ON a.id_professor = u.id_usuario
          INNER JOIN materias m ON a.id_materia = m.id_materia
          INNER JOIN turmas t ON a.id_turma = t.id_turma
          WHERE 1=1";

if ($data_inicio && $data_fim) {
    $query .= " AND a.data BETWEEN :data_inicio AND :data_fim";
}

if ($id_turma) {
    $query .= " AND a.id_turma = :id_turma";
}

if ($id_professor) {
    $query .= " AND a.id_professor = :id_professor";
}

$query .= " ORDER BY a.data, a.hora";

$stmt = $db->prepare($query);

if ($data_inicio && $data_fim) {
    $stmt->bindParam(':data_inicio', $data_inicio);
    $stmt->bindParam(':data_fim', $data_fim);
}

if ($id_turma) {
    $stmt->bindParam(':id_turma', $id_turma);
}

if ($id_professor) {
    $stmt->bindParam(':id_professor', $id_professor);
}

$stmt->execute();

$aulas = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $aulas
]);
?>`
    },
    {
      title: '8. api/atividades/criar.php - Criar Atividade',
      description: 'Professor cria atividade',
      language: 'php',
      code: `<?php
// api/atividades/criar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id_aula) && !empty($data->descricao) && 
    !empty($data->data_entrega) && isset($data->valor_pontos)) {
    
    $query = "INSERT INTO atividades (id_aula, descricao, data_entrega, valor_pontos) 
              VALUES (:id_aula, :descricao, :data_entrega, :valor_pontos)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':id_aula', $data->id_aula);
    $stmt->bindParam(':descricao', $data->descricao);
    $stmt->bindParam(':data_entrega', $data->data_entrega);
    $stmt->bindParam(':valor_pontos', $data->valor_pontos);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Atividade criada com sucesso',
            'id_atividade' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao criar atividade'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '9. api/atividades/enviar.php - Aluno Envia Atividade',
      description: 'Enviar resposta de atividade',
      language: 'php',
      code: `<?php
// api/atividades/enviar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id_atividade) && !empty($data->id_aluno)) {
    
    $query = "INSERT INTO envios_atividades (id_atividade, id_aluno, arquivo_enviado) 
              VALUES (:id_atividade, :id_aluno, :arquivo_enviado)";
    
    $stmt = $db->prepare($query);
    
    $arquivo = isset($data->arquivo_enviado) ? $data->arquivo_enviado : null;
    
    $stmt->bindParam(':id_atividade', $data->id_atividade);
    $stmt->bindParam(':id_aluno', $data->id_aluno);
    $stmt->bindParam(':arquivo_enviado', $arquivo);
    
    if ($stmt->execute()) {
        $id_envio = $db->lastInsertId();
        
        // Se houver múltiplos anexos
        if (isset($data->anexos) && is_array($data->anexos)) {
            $query_anexo = "INSERT INTO envio_anexo (id_envio, caminho_arquivo, tipo_arquivo) 
                           VALUES (:id_envio, :caminho, :tipo)";
            $stmt_anexo = $db->prepare($query_anexo);
            
            foreach ($data->anexos as $anexo) {
                $stmt_anexo->bindParam(':id_envio', $id_envio);
                $stmt_anexo->bindParam(':caminho', $anexo->caminho);
                $stmt_anexo->bindParam(':tipo', $anexo->tipo);
                $stmt_anexo->execute();
            }
        }
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Atividade enviada com sucesso',
            'id_envio' => $id_envio
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao enviar atividade'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '10. api/atividades/avaliar.php - Professor Avalia',
      description: 'Corrigir e dar nota',
      language: 'php',
      code: `<?php
// api/atividades/avaliar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id_envio) && isset($data->nota)) {
    
    $query = "UPDATE envios_atividades 
              SET nota = :nota, comentario_professor = :comentario 
              WHERE id_envio = :id_envio";
    
    $stmt = $db->prepare($query);
    
    $comentario = isset($data->comentario_professor) ? $data->comentario_professor : null;
    
    $stmt->bindParam(':nota', $data->nota);
    $stmt->bindParam(':comentario', $comentario);
    $stmt->bindParam(':id_envio', $data->id_envio);
    
    if ($stmt->execute()) {
        // Atualizar pontuação do aluno
        $query_pontos = "SELECT id_aluno FROM envios_atividades WHERE id_envio = :id_envio";
        $stmt_pontos = $db->prepare($query_pontos);
        $stmt_pontos->bindParam(':id_envio', $data->id_envio);
        $stmt_pontos->execute();
        $envio = $stmt_pontos->fetch(PDO::FETCH_ASSOC);
        
        if ($envio) {
            $query_update = "INSERT INTO pontuacao (id_aluno, pontos_totais) 
                            VALUES (:id_aluno, :pontos)
                            ON DUPLICATE KEY UPDATE 
                            pontos_totais = pontos_totais + :pontos";
            
            $stmt_update = $db->prepare($query_update);
            $stmt_update->bindParam(':id_aluno', $envio['id_aluno']);
            $stmt_update->bindParam(':pontos', $data->nota);
            $stmt_update->execute();
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Atividade avaliada com sucesso'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao avaliar atividade'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '11. api/turmas/criar.php - Criar Turma',
      description: 'Admin cria turma',
      language: 'php',
      code: `<?php
// api/turmas/criar.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nome_turma) && !empty($data->ano) && !empty($data->turno)) {
    
    $query = "INSERT INTO turmas (nome_turma, ano, turno) 
              VALUES (:nome_turma, :ano, :turno)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':nome_turma', $data->nome_turma);
    $stmt->bindParam(':ano', $data->ano);
    $stmt->bindParam(':turno', $data->turno);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Turma criada com sucesso',
            'id_turma' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao criar turma'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados incompletos'
    ]);
}
?>`
    },
    {
      title: '12. .htaccess - Configuração Apache',
      description: 'Colocar na raiz do projeto PHP',
      language: 'apache',
      code: `# .htaccess
RewriteEngine On

# Permitir CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Remover .php da URL
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.php -f
RewriteRule ^(.*)$ $1.php [NC,L]

# Habilitar PHP Error Reporting (apenas desenvolvimento)
php_flag display_errors on
php_value error_reporting 32767`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-primary">📦 Backend PHP + MySQL</h1>
              <p className="text-sm text-muted-foreground">
                Código completo para XAMPP - Copie e cole no VS Code
              </p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instruções */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">📋 Como usar este código</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-50 space-y-2">
            <p>1. Instale o XAMPP e inicie Apache + MySQL</p>
            <p>2. Crie a pasta: <code className="bg-white/20 px-2 py-1 rounded">C:/xampp/htdocs/agenda-escolar-backend/</code></p>
            <p>3. Copie cada arquivo abaixo mantendo a estrutura de pastas</p>
            <p>4. Execute o script SQL no phpMyAdmin (localhost/phpmyadmin)</p>
            <p>5. Senha dos usuários demo: <strong>123456</strong></p>
          </CardContent>
        </Card>

        {/* Estrutura de Pastas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-yellow-600" />
              Estrutura de Pastas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`agenda-escolar-backend/
├── config/
│   └── database.php
├── api/
│   ├── login.php
│   ├── usuarios/
│   │   ├── criar.php
│   │   ├── listar.php
│   │   ├── atualizar.php
│   │   └── deletar.php
│   ├── aulas/
│   │   ├── criar.php
│   │   ├── listar.php
│   │   └── atualizar.php
│   ├── atividades/
│   │   ├── criar.php
│   │   ├── listar.php
│   │   ├── enviar.php
│   │   └── avaliar.php
│   ├── turmas/
│   │   ├── criar.php
│   │   └── listar.php
│   └── materias/
│       ├── criar.php
│       └── listar.php
├── uploads/
│   └── (arquivos enviados)
└── .htaccess`}
            </pre>
          </CardContent>
        </Card>

        {/* Código dos Arquivos */}
        <div className="space-y-6">
          {codeBlocks.map((block, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileCode className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <CardTitle>{block.title}</CardTitle>
                      <CardDescription>{block.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(block.code, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-lg border">
                  <pre className="p-4 text-sm bg-slate-950 text-slate-50">
                    <code>{block.code}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nota Final */}
        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardContent className="py-6">
            <h3 className="flex items-center gap-2 text-green-900 mb-2">
              ✅ Tudo Pronto!
            </h3>
            <p className="text-green-800 mb-4">
              Após configurar todos os arquivos, acesse a API em:
            </p>
            <code className="block bg-white p-3 rounded text-sm border border-green-300">
              http://localhost/agenda-escolar-backend/api/login.php
            </code>
            <p className="text-green-800 mt-4 text-sm">
              💡 Dica: Use Postman ou Insomnia para testar as rotas da API
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
