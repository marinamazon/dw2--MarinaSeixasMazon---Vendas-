from database import SessionLocal
from models import Produto
from decimal import Decimal

# Dados de exemplo para a loja
produtos = [
    {
        "nome": "Caderno Universitário 10 Matérias",
        "descricao": "Caderno com 200 folhas, capa dura e espiral",
        "preco": Decimal("24.90"),
        "estoque": 50,
        "categoria": "papelaria",
        "sku": "CAD-UNI-10M"
    },
    {
        "nome": "Pasta Aba Elástico",
        "descricao": "Pasta plástica formato A4 com elástico",
        "preco": Decimal("7.50"),
        "estoque": 60,
        "categoria": "papelaria",
        "sku": "PAS-A4-EL"
    },
    {
        "nome": "Papel Sulfite A4",
        "descricao": "Pacote com 100 folhas brancas",
        "preco": Decimal("12.90"),
        "estoque": 40,
        "categoria": "papelaria",
        "sku": "PAP-A4-100"
    },
    {
        "nome": "Marcador de Texto",
        "descricao": "Marcador fluorescente amarelo",
        "preco": Decimal("4.50"),
        "estoque": 55,
        "categoria": "escritorio",
        "sku": "MARC-AM"
    },
    {
        "nome": "Caderno de Desenho",
        "descricao": "Caderno espiral com 48 folhas",
        "preco": Decimal("9.90"),
        "estoque": 35,
        "categoria": "arte",
        "sku": "CAD-DES-48"
    },
    {
        "nome": "Lápis de Cor 12 Cores",
        "descricao": "Conjunto de lápis de cor",
        "preco": Decimal("19.90"),
        "estoque": 30,
        "categoria": "arte",
        "sku": "LAP-COR-12"
    },
    {
        "nome": "Giz de Cera 12 Cores",
        "descricao": "Conjunto de giz de cera grosso",
        "preco": Decimal("8.90"),
        "estoque": 40,
        "categoria": "arte",
        "sku": "GIZ-12"
    },
    {
        "nome": "Calculadora Simples",
        "descricao": "Calculadora de mesa com 12 dígitos",
        "preco": Decimal("15.90"),
        "estoque": 20,
        "categoria": "escritorio",
        "sku": "CALC-12"
    },
    {
        "nome": "Grampeador",
        "descricao": "Grampeador de mesa para 20 folhas",
        "preco": Decimal("18.90"),
        "estoque": 25,
        "categoria": "escritorio",
        "sku": "GRAM-20"
    },
    {
        "nome": "Clips 2/0",
        "descricao": "Caixa com 100 clips galvanizados",
        "preco": Decimal("5.90"),
        "estoque": 50,
        "categoria": "escritorio",
        "sku": "CLIP-2-100"
    },
    {
        "nome": "Pincel Atômico",
        "descricao": "Marcador permanente preto",
        "preco": Decimal("6.90"),
        "estoque": 45,
        "categoria": "escritorio",
        "sku": "PIN-AT-PT"
    }
]

# Adiciona campo `imagem` usando picsum.photos para cada produto (seed a partir do nome)
for p in produtos:
    seed = ''.join(ch for ch in p['nome'] if ch.isalnum())[:30]
    p['imagem'] = f"https://picsum.photos/seed/{seed}/400/300"

def seed_db():
    db = SessionLocal()
    try:
        # Limpa dados existentes
        db.query(Produto).delete()
        
        # Insere novos produtos
        for produto_data in produtos:
            produto = Produto(**produto_data)
            db.add(produto)
        
        db.commit()
        print("Base de dados populada com sucesso!")
        
    except Exception as e:
        print(f"Erro ao popular base de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
