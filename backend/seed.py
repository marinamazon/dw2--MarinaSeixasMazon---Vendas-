from database import SessionLocal
from models import Produto
from decimal import Decimal

# Dados de exemplo para a loja escolar
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
        "nome": "Lápis Preto 2B",
        "descricao": "Lápis para escrita geral, graduação 2B",
        "preco": Decimal("1.50"),
        "estoque": 100,
        "categoria": "escolar",
        "sku": "LAP-2B"
    },
    {
        "nome": "Caneta Esferográfica Azul",
        "descricao": "Caneta com ponta média 1.0mm",
        "preco": Decimal("2.50"),
        "estoque": 80,
        "categoria": "escolar",
        "sku": "CAN-ESF-AZ"
    },
    {
        "nome": "Borracha Branca",
        "descricao": "Borracha macia para apagar grafite",
        "preco": Decimal("1.00"),
        "estoque": 120,
        "categoria": "escolar",
        "sku": "BOR-BR"
    },
    {
        "nome": "Apontador com Depósito",
        "descricao": "Apontador de metal com depósito plástico",
        "preco": Decimal("5.90"),
        "estoque": 40,
        "categoria": "escolar",
        "sku": "APT-DEP"
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
        "nome": "Tesoura Escolar",
        "descricao": "Tesoura sem ponta, 13cm",
        "preco": Decimal("8.90"),
        "estoque": 30,
        "categoria": "escolar",
        "sku": "TES-13"
    },
    {
        "nome": "Cola Branca 90g",
        "descricao": "Cola líquida para papel e cartolina",
        "preco": Decimal("4.90"),
        "estoque": 45,
        "categoria": "escolar",
        "sku": "COL-90G"
    },
    {
        "nome": "Régua 30cm",
        "descricao": "Régua plástica transparente",
        "preco": Decimal("3.50"),
        "estoque": 70,
        "categoria": "escolar",
        "sku": "REG-30"
    },
    {
        "nome": "Estojo Escolar",
        "descricao": "Estojo com zíper e 2 divisórias",
        "preco": Decimal("15.90"),
        "estoque": 25,
        "categoria": "escolar",
        "sku": "EST-2DIV"
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
        "nome": "Mochila Escolar",
        "descricao": "Mochila resistente com múltiplos compartimentos",
        "preco": Decimal("89.90"),
        "estoque": 15,
        "categoria": "escolar",
        "sku": "MOC-ESC"
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
