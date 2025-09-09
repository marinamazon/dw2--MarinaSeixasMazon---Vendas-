// Configurações
const API_URL = 'http://localhost:8000';
const STORAGE_KEY = 'shopping-cart';
const DISCOUNT_CODE = 'ALUNO10';
const DISCOUNT_PERCENT = 0.1;

// Estado global da aplicação
let products = [];
let cart = loadCart();
// Kit de materiais escolares (estático)
const kitItems = [
    { id: 'kit-01', nome: 'Lápis grafite 2B (6un)', preco: 9.90, quantidade: 1, imagem: 'https://i.imgur.com/3G7Qx6Y.jpg' },
    { id: 'kit-02', nome: 'Caneta esferográfica azul (2un)', preco: 6.00, quantidade: 1, imagem: 'https://i.imgur.com/kKQp0kD.jpg' },
    { id: 'kit-03', nome: 'Borracha branca', preco: 1.50, quantidade: 1, imagem: 'https://i.imgur.com/5bXkY9s.jpg' },
    { id: 'kit-04', nome: 'Apontador com depósito', preco: 7.90, quantidade: 1, imagem: 'https://i.imgur.com/2uH1ZtA.jpg' },
    { id: 'kit-05', nome: 'Caderno universitário 10 matérias', preco: 24.90, quantidade: 1, imagem: 'https://i.imgur.com/8Qz7Z4r.jpg' },
    { id: 'kit-06', nome: 'Estojo com zíper', preco: 19.90, quantidade: 1, imagem: 'https://i.imgur.com/YeH4K7f.jpg' }
];

// Elementos DOM
const productsGrid = document.getElementById('products-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartButton = document.querySelector('.cart-button');
const cartItems = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const totalAmount = document.querySelector('.total-amount');
const checkoutButton = document.querySelector('.checkout-button');
const productSearch = document.getElementById('product-search');
const sortSelect = document.getElementById('sort-select');
const couponInput = document.getElementById('coupon-input');
const applyCouponButton = document.getElementById('apply-coupon');
const adminModal = document.getElementById('admin-modal');
const productForm = document.getElementById('product-form');
const toast = document.getElementById('toast');

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
cartButton.addEventListener('click', toggleCart);
document.querySelector('.close-cart').addEventListener('click', closeCart);
productSearch.addEventListener('input', debounce(filterProducts, 300));
sortSelect.addEventListener('change', handleSort);
applyCouponButton.addEventListener('click', applyCoupon);
checkoutButton.addEventListener('click', handleCheckout);
productForm.addEventListener('submit', handleProductSubmit);

// Funções de Inicialização
async function initialize() {
    // Primeiro renderizamos itens estáticos (kit) para que apareçam mesmo sem backend
    renderKit();
    try {
        await fetchProducts();
        renderProducts();
    } catch (error) {
        // Se o backend não estiver disponível, mostramos um toast mas mantemos o kit visível
        showToast('Aviso: backend indisponível. Alguns produtos podem não aparecer.');
        console.error('Initialization error:', error);
    } finally {
        updateCartUI();
        loadSortPreference();
    }
}

function renderKit() {
    const kitGrid = document.getElementById('kit-grid');
    kitGrid.innerHTML = kitItems.map(item => `
        <div class="kit-item" data-id="${item.id}">
            <img src="${item.imagem}" alt="${item.nome}" class="kit-img" loading="lazy">
            <h3>${item.nome}</h3>
            <p>R$ ${item.preco.toFixed(2)}</p>
            <button class="kit-add" onclick="addKitToCart('${item.id}')">Adicionar ao carrinho</button>
        </div>
    `).join('');
}

function addKitToCart(kitId) {
    const kit = kitItems.find(k => k.id === kitId);
    if (!kit) return;

    // Produtos remotos têm ids numéricos; itens de kit são locais — criamos id temporário
    const existing = cart.items.find(i => i.id === kit.id);
    if (existing) {
        existing.quantidade += 1;
    } else {
        cart.items.push({ id: kit.id, nome: kit.nome, preco: kit.preco, quantidade: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`${kit.nome} adicionado ao carrinho`);
}

// Funções de API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        products = await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

async function createProduct(productData) {
    try {
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Erro ao criar produto');
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

async function updateProduct(id, productData) {
    try {
        const response = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Erro ao atualizar produto');
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

async function deleteProduct(id) {
    try {
        const response = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao deletar produto');
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

// Funções de Renderização
function renderProducts(filteredProducts = products) {
    productsGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-id="${product.id}">
            <img 
                src="${product.imagem || 'https://via.placeholder.com/400x300?text=Sem+imagem'}" 
                alt="${product.nome}"
                class="product-image"
                loading="lazy">
            <div class="product-info">
                <h2 class="product-name">${product.nome}</h2>
                <p class="product-price">R$ ${product.preco.toFixed(2)}</p>
                <p class="product-stock">
                    ${product.estoque > 0 
                        ? `${product.estoque} em estoque` 
                        : 'Fora de estoque'}
                </p>
                <button 
                    class="add-to-cart"
                    onclick="addToCart(${product.id})"
                    ${product.estoque === 0 ? 'disabled' : ''}
                    aria-label="Adicionar ${product.nome} ao carrinho">
                    ${product.estoque === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
                </button>
            </div>
        </article>
    `).join('');
}

function renderCart() {
    cartItems.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img 
                src="${item.imagem || 'https://via.placeholder.com/60?text=?'}" 
                alt="${item.nome}"
                width="60"
                height="60">
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.nome}</h3>
                <p class="cart-item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button 
                        onclick="updateCartItem(${item.id}, ${item.quantidade - 1})"
                        aria-label="Diminuir quantidade">
                        -
                    </button>
                    <span>${item.quantidade}</span>
                    <button 
                        onclick="updateCartItem(${item.id}, ${item.quantidade + 1})"
                        aria-label="Aumentar quantidade">
                        +
                    </button>
                </div>
            </div>
            <button 
                onclick="removeFromCart(${item.id})"
                aria-label="Remover ${item.nome} do carrinho">
                ✕
            </button>
        </div>
    `).join('');
    
    updateCartTotal();
}

// Funções do Carrinho
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.estoque === 0) return;

    const cartItem = cart.items.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantidade < product.estoque) {
            updateCartItem(productId, cartItem.quantidade + 1);
        } else {
            showToast('Quantidade máxima atingida');
        }
    } else {
        cart.items.push({ ...product, quantidade: 1 });
        saveCart();
        updateCartUI();
        showToast('Produto adicionado ao carrinho');
    }
}

function updateCartItem(productId, newQuantity) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > product.estoque) {
        showToast('Quantidade indisponível');
        return;
    }

    const cartItem = cart.items.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantidade = newQuantity;
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart.items = cart.items.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast('Produto removido do carrinho');
}

function updateCartUI() {
    renderCart();
    cartCount.textContent = cart.items.reduce((sum, item) => sum + item.quantidade, 0);
}

function updateCartTotal() {
    let subtotal = cart.items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    let total = cart.discountApplied ? subtotal * (1 - DISCOUNT_PERCENT) : subtotal;
    totalAmount.textContent = `R$ ${total.toFixed(2)}`;
}

// Funções de Persistência
function loadCart() {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : { items: [], discountApplied: false };
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function loadSortPreference() {
    const savedSort = localStorage.getItem('sort-preference');
    if (savedSort) {
        sortSelect.value = savedSort;
        handleSort();
    }
}

// Funções de UI
function toggleCart() {
    const isExpanded = cartButton.getAttribute('aria-expanded') === 'true';
    cartButton.setAttribute('aria-expanded', !isExpanded);
    cartDrawer.classList.toggle('open');
    cartDrawer.setAttribute('aria-hidden', isExpanded);
}

function closeCart() {
    cartButton.setAttribute('aria-expanded', 'false');
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
}

function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// Funções de Filtro e Ordenação
function filterProducts() {
    const searchTerm = productSearch.value.toLowerCase();
    const filtered = products.filter(product => 
        product.nome.toLowerCase().includes(searchTerm) ||
        product.descricao?.toLowerCase().includes(searchTerm)
    );
    renderProducts(filtered);
}

function handleSort() {
    const [criteria, direction] = sortSelect.value.split('-');
    const sorted = [...products].sort((a, b) => {
        if (criteria === 'name') {
            return direction === 'asc' 
                ? a.nome.localeCompare(b.nome)
                : b.nome.localeCompare(a.nome);
        } else {
            return direction === 'asc' 
                ? a.preco - b.preco
                : b.preco - a.preco;
        }
    });
    
    localStorage.setItem('sort-preference', sortSelect.value);
    renderProducts(sorted);
}

// Funções de Checkout
async function handleCheckout() {
    if (cart.items.length === 0) {
        showToast('Carrinho vazio');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/carrinho/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.items,
                coupon: cart.discountApplied ? DISCOUNT_CODE : null
            })
        });

        if (!response.ok) throw new Error('Erro ao processar pedido');

        cart = { items: [], discountApplied: false };
        saveCart();
        updateCartUI();
        closeCart();
        showToast('Pedido realizado com sucesso!');
        
        // Atualiza os produtos após o checkout
        await fetchProducts();
        renderProducts();
    } catch (error) {
        showToast('Erro ao processar pedido');
        console.error('Checkout error:', error);
    }
}

function applyCoupon() {
    const code = couponInput.value.trim().toUpperCase();
    if (code === DISCOUNT_CODE) {
        cart.discountApplied = true;
        saveCart();
        updateCartTotal();
        showToast('Cupom aplicado com sucesso!');
        couponInput.value = '';
    } else {
        showToast('Cupom inválido');
    }
}

// Funções de Admin
function openAdminModal(product = null) {
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    
    title.textContent = product ? 'Editar Produto' : 'Novo Produto';
    
    if (product) {
        form.elements['product-name'].value = product.nome;
        form.elements['product-description'].value = product.descricao || '';
        form.elements['product-price'].value = product.preco;
        form.elements['product-stock'].value = product.estoque;
        form.elements['product-category'].value = product.categoria;
        form.elements['product-sku'].value = product.sku || '';
        form.dataset.productId = product.id;
    } else {
        form.reset();
        delete form.dataset.productId;
    }
    
    adminModal.classList.add('open');
}

async function handleProductSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const productId = form.dataset.productId;
    
    const productData = {
        nome: form.elements['product-name'].value,
        descricao: form.elements['product-description'].value,
        preco: parseFloat(form.elements['product-price'].value),
        estoque: parseInt(form.elements['product-stock'].value),
        categoria: form.elements['product-category'].value,
        sku: form.elements['product-sku'].value
    };

    try {
        if (productId) {
            await updateProduct(productId, productData);
            showToast('Produto atualizado com sucesso!');
        } else {
            await createProduct(productData);
            showToast('Produto criado com sucesso!');
        }
        
        await fetchProducts();
        renderProducts();
        adminModal.classList.remove('open');
    } catch (error) {
        showToast('Erro ao salvar produto');
        console.error('Product submit error:', error);
    }
}

// Utilidades
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
