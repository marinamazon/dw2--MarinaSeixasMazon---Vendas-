from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Produto, PedidoCreate
from database import SessionLocal, init_db
import schemas
from typing import List, Optional
from decimal import Decimal

app = FastAPI(title="API Loja Escolar")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar as origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa o banco de dados
init_db()

# Dependency para sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/produtos", response_model=List[schemas.ProdutoResponse])
async def listar_produtos(
    search: Optional[str] = None,
    categoria: Optional[str] = None,
    sort: Optional[str] = None,
    db: SessionLocal = Depends(get_db)
):
    """
    Lista todos os produtos com opções de filtro e ordenação.
    """
    query = db.query(Produto)
    
    if search:
        query = query.filter(
            or_(
                Produto.nome.ilike(f"%{search}%"),
                Produto.descricao.ilike(f"%{search}%")
            )
        )
    
    if categoria:
        query = query.filter(Produto.categoria == categoria)
    
    if sort:
        if sort == "price-asc":
            query = query.order_by(Produto.preco.asc())
        elif sort == "price-desc":
            query = query.order_by(Produto.preco.desc())
        elif sort == "name-asc":
            query = query.order_by(Produto.nome.asc())
        elif sort == "name-desc":
            query = query.order_by(Produto.nome.desc())
    
    produtos = query.all()
    return produtos

@app.post("/produtos", response_model=schemas.ProdutoResponse, status_code=201)
async def criar_produto(
    produto: schemas.ProdutoCreate,
    db: SessionLocal = Depends(get_db)
):
    """
    Cria um novo produto.
    """
    db_produto = Produto(**produto.dict())
    db.add(db_produto)
    try:
        db.commit()
        db.refresh(db_produto)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="SKU já existe")
    return db_produto

@app.put("/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
async def atualizar_produto(
    produto_id: int,
    produto: schemas.ProdutoUpdate,
    db: SessionLocal = Depends(get_db)
):
    """
    Atualiza um produto existente.
    """
    db_produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    for key, value in produto.dict(exclude_unset=True).items():
        setattr(db_produto, key, value)
    
    try:
        db.commit()
        db.refresh(db_produto)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="SKU já existe")
    return db_produto

@app.delete("/produtos/{produto_id}")
async def deletar_produto(
    produto_id: int,
    db: SessionLocal = Depends(get_db)
):
    """
    Remove um produto.
    """
    db_produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(db_produto)
    db.commit()
    return {"message": "Produto removido com sucesso"}

@app.post("/carrinho/confirmar")
async def confirmar_pedido(
    pedido: PedidoCreate,
    db: SessionLocal = Depends(get_db)
):
    """
    Confirma um pedido, aplicando desconto se houver cupom válido e atualizando estoque.
    """
    # Valida itens e estoque
    total = Decimal('0.00')
    for item in pedido.items:
        produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
        if not produto:
            raise HTTPException(
                status_code=404,
                detail=f"Produto {item.produto_id} não encontrado"
            )
        
        if produto.estoque < item.quantidade:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para {produto.nome}"
            )
        
        total += produto.preco * item.quantidade
    
    # Aplica desconto se cupom válido
    if pedido.cupom == "ALUNO10":
        total = total * Decimal('0.90')  # 10% de desconto
    
    # Atualiza estoque
    for item in pedido.items:
        produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
        produto.estoque -= item.quantidade
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar pedido"
        )
    
    return {
        "message": "Pedido confirmado com sucesso",
        "total": float(total)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
