from pydantic import BaseModel, constr, condecimal
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProdutoBase(BaseModel):
    nome: constr(min_length=3, max_length=60)
    descricao: Optional[str] = None
    preco: condecimal(ge=Decimal('0.01'), decimal_places=2)
    estoque: int
    categoria: str
    sku: Optional[str] = None

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(ProdutoBase):
    nome: Optional[constr(min_length=3, max_length=60)] = None
    preco: Optional[condecimal(ge=Decimal('0.01'), decimal_places=2)] = None
    estoque: Optional[int] = None
    categoria: Optional[str] = None

class ProdutoResponse(ProdutoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ItemPedido(BaseModel):
    produto_id: int
    quantidade: int

class PedidoCreate(BaseModel):
    items: List[ItemPedido]
    cupom: Optional[str] = None
