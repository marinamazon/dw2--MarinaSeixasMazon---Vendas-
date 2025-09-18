const http = require('http');
const url = require('url');

const products = [
  { id: 1, nome: 'Lápis grafite 2B (6un)', preco: 9.9, estoque: 10, imagem: null, descricao: '' },
  { id: 2, nome: 'Caneta esferográfica azul (2un)', preco: 6.0, estoque: 15, imagem: null, descricao: '' },
  { id: 3, nome: 'Borracha branca', preco: 1.5, estoque: 20, imagem: null, descricao: '' },
  { id: 4, nome: 'Apontador com depósito', preco: 7.9, estoque: 5, imagem: null, descricao: '' },
  { id: 5, nome: 'Caderno universitário 10 matérias', preco: 24.9, estoque: 8, imagem: null, descricao: '' },
  { id: 6, nome: 'Estojo com zíper', preco: 19.9, estoque: 6, imagem: null, descricao: '' }
];

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (parsed.pathname === '/produtos' && req.method === 'GET') {
    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(products));
    return;
  }

  if (parsed.pathname === '/carrinho/confirmar' && req.method === 'POST') {
    setCorsHeaders(res);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const pedido = JSON.parse(body || '{}');
        const items = Array.isArray(pedido.items) ? pedido.items : [];
        let total = 0;
        for (const it of items) {
          // aceita itens personalizados com preco e quantidade
          if (it.preco != null && it.quantidade != null) {
            total += Number(it.preco) * Number(it.quantidade);
          } else {
            // tenta procurar pelo id/produto
            const pid = it.id || it.produto_id || it.produtoId;
            const prod = products.find(p => String(p.id) === String(pid));
            if (prod) total += prod.preco * (it.quantidade || 1);
          }
        }
        const response = { message: 'Pedido confirmado (mock)', total };
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
    return;
  }

  // fallback
  setCorsHeaders(res);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

const PORT = 8000;
server.listen(PORT, () => console.log(`Mock API server running on http://localhost:${PORT}`));

process.on('SIGINT', () => { server.close(() => process.exit(0)); });
