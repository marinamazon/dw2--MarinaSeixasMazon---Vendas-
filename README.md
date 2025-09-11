# Loja - Sistema de Vendas

Sistema web de e-commerce para uma loja, desenvolvido como projeto da disciplina DW2.

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (Flexbox/Grid)
- JavaScript (ES6+)

### Backend
- Python
- FastAPI
- SQLite
- SQLAlchemy

## Funcionalidades

- Catálogo de produtos com busca e filtros
- Carrinho de compras persistente
- Sistema de cupons de desconto
- Gestão de estoque
- Interface responsiva e acessível

## Como Executar

### Backend

1. Instale as dependências:
```bash
cd backend
pip install -r requirements.txt
```

2. Execute o script de seed para popular o banco:
```bash
python seed.py
```

3. Inicie o servidor:
```bash
uvicorn app:app --reload
```

O servidor estará rodando em `http://localhost:8000`

### Frontend

1. Abra o arquivo `frontend/index.html` em um navegador moderno
   - Para desenvolvimento, recomenda-se usar a extensão Live Server do VS Code

## Estrutura do Projeto

```
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── scripts.js
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── seed.py
│   └── requirements.txt
└── README.md
```

## Desenvolvimento

### Configuração do Ambiente

1. Clone o repositório
2. Configure o ambiente Python (recomenda-se usar venv)
3. Instale as dependências do backend
4. Execute o seed do banco de dados
5. Inicie o servidor backend
6. Abra o frontend no navegador

### Padrões de Código

- Frontend: JavaScript ES6+, organizado em módulos
- Backend: Python com type hints, seguindo PEP 8
- API: RESTful com endpoints bem definidos
- Banco: SQLite com ORM (SQLAlchemy)

## API Endpoints

- `GET /produtos`: Lista todos os produtos
- `POST /produtos`: Cria novo produto
- `PUT /produtos/{id}`: Atualiza produto
- `DELETE /produtos/{id}`: Remove produto
- `POST /carrinho/confirmar`: Processa pedido

## Peculiaridades Implementadas

1. Acessibilidade (ARIA labels, contraste, navegação por teclado)
2. Validações customizadas (frontend e backend)
3. Filtros avançados sem reload
4. Ordenação persistida (localStorage)
5. Tratamento de erros com feedback visual

## Autor

Marina Seixas Mazon
