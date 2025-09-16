// Configurações
const API_URL = 'http://localhost:8000';
const STORAGE_KEY = 'shopping-cart';
const DISCOUNT_CODE = 'ALUNO10';
const DISCOUNT_PERCENT = 0.1;

// Estado global da aplicação
let products = [];
let cart = loadCart();

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
const categorySelect = document.getElementById('category-select');
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
if (categorySelect) categorySelect.addEventListener('change', handleCategoryFilter);
applyCouponButton.addEventListener('click', applyCoupon);
if (checkoutButton) checkoutButton.addEventListener('click', handleCheckout);
productForm.addEventListener('submit', handleProductSubmit);

// Event delegation: product add buttons
productsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = btn.getAttribute('data-product-id');
    if (id) addToCart(id);
});

// Event delegation: cart item controls
cartItems.addEventListener('click', (e) => {
    const decrease = e.target.closest('.cart-qty-decrease');
    const increase = e.target.closest('.cart-qty-increase');
    const remove = e.target.closest('.cart-remove');

    if (decrease) {
        const id = decrease.getAttribute('data-item-id');
        // find current quantity
        const item = cart.items.find(it => String(it.id) === String(id));
        if (item) updateCartItem(id, item.quantidade - 1);
        return;
    }

    if (increase) {
        const id = increase.getAttribute('data-item-id');
        const item = cart.items.find(it => String(it.id) === String(id));
        if (item) updateCartItem(id, item.quantidade + 1);
        return;
    }

    if (remove) {
        const id = remove.getAttribute('data-item-id');
        if (id) removeFromCart(id);
        return;
    }
});

// Custom item modal elements & handlers
const addCustomButton = document.getElementById('add-custom-button');
const customModal = document.getElementById('custom-item-modal');
const customForm = document.getElementById('custom-item-form');
const closeCustomBtns = document.getElementsByClassName('close-custom');

if (addCustomButton) addCustomButton.addEventListener('click', openCustomModal);
if (customForm) customForm.addEventListener('submit', handleCustomSubmit);
Array.from(closeCustomBtns).forEach(btn => btn.addEventListener('click', closeCustomModal));

function openCustomModal() {
    if (!customModal) return;
    customModal.classList.add('open');
    customModal.setAttribute('aria-hidden', 'false');
    const nameEl = document.getElementById('custom-name');
    if (nameEl) nameEl.focus();
}

function closeCustomModal() {
    if (!customModal) return;
    customModal.classList.remove('open');
    customModal.setAttribute('aria-hidden', 'true');
    if (customForm) customForm.reset();
}

function handleCustomSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('custom-name').value.trim();
    const price = parseFloat(document.getElementById('custom-price').value);
    const quantity = parseInt(document.getElementById('custom-quantity').value, 10);
    const category = document.getElementById('custom-category').value.trim() || 'personalizado';
    const description = document.getElementById('custom-description').value.trim() || '';

    if (!name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
        showToast('Preencha nome, preço válido e quantidade válida');
        return;
    }

    const id = `custom-${Date.now()}`;
    const item = { id, nome: name, preco: price, quantidade: quantity, categoria: category, descricao: description };

    cart.items.push(item);
    saveCart();
    updateCartUI();
    closeCustomModal();
    showToast(`${name} adicionado ao carrinho`);
}

// Funções de Inicialização
async function initialize() {
    // Itens do kit removidos conforme solicitação
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
        // Load saved category filter
        const savedCategory = localStorage.getItem('category-filter');
        if (savedCategory && categorySelect) {
            categorySelect.value = savedCategory;
        }
    }
}

// Kit functions removed

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
    if (!filteredProducts || filteredProducts.length === 0) {
        productsGrid.innerHTML = `<p class="empty-note">Nenhum produto disponível — verifique o backend ou adicione itens personalizados.</p>`;
        return;
    }

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
                    data-product-id="${product.id}"
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
                src="${item.imagem || 'images/placeholder-60.svg'}" 
                alt="${item.nome}"
                width="60"
                height="60">
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.nome}</h3>
                <p class="cart-item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button class="cart-qty-decrease" data-item-id="${item.id}" aria-label="Diminuir quantidade">-</button>
                    <span>${item.quantidade}</span>
                    <button class="cart-qty-increase" data-item-id="${item.id}" aria-label="Aumentar quantidade">+</button>
                </div>
            </div>
            <button class="cart-remove" data-item-id="${item.id}" aria-label="Remover ${item.nome} do carrinho">✕</button>
        </div>
    `).join('');
    
    updateCartTotal();
}

// Funções do Carrinho
function addToCart(productId) {
    // Normaliza comparações de id (backend usa números, itens personalizados usam strings)
    const product = products.find(p => String(p.id) === String(productId));
    if (!product || product.estoque === 0) return;

    const cartItem = cart.items.find(item => String(item.id) === String(productId));
    
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
    // Normaliza comparações de id (podem ser strings para itens personalizados)
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    // Se for um produto do backend, tenta validar estoque buscando pelo id
    const product = products.find(p => String(p.id) === String(productId));
    if (product && newQuantity > product.estoque) {
        showToast('Quantidade indisponível');
        return;
    }

    const cartItem = cart.items.find(item => String(item.id) === String(productId));
    if (cartItem) {
        cartItem.quantidade = newQuantity;
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    // Comparação por string garante que '123' e 123 sejam considerados iguais
    cart.items = cart.items.filter(item => String(item.id) !== String(productId));
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
    const category = categorySelect ? categorySelect.value : '';
    const filtered = products.filter(product => {
        const matchesSearch = product.nome.toLowerCase().includes(searchTerm) || product.descricao?.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.categoria === category || (category === 'personalizado' && String(product.id).startsWith('custom-'));
        return matchesSearch && matchesCategory;
    });
    renderProducts(filtered);
}

function handleCategoryFilter() {
    localStorage.setItem('category-filter', categorySelect.value);
    filterProducts();
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
    // Monta resumo do pedido
    const subtotal = cart.items.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const total = cart.discountApplied ? subtotal * (1 - DISCOUNT_PERCENT) : subtotal;
    const orderSummary = {
        items: cart.items,
        subtotal,
        total,
        coupon: cart.discountApplied ? DISCOUNT_CODE : null,
        message: 'Pedido gerado localmente.'
    };

    // Tenta enviar ao backend, mas mesmo que falhe, salvamos o resumo e redirecionamos
    try {
        const response = await fetch(`${API_URL}/carrinho/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart.items, coupon: orderSummary.coupon })
        });
        if (response.ok) {
            const data = await response.json();
            orderSummary.message = data.message || 'Pedido confirmado com sucesso';
            orderSummary.total = data.total || orderSummary.total;
        } else {
            orderSummary.message = 'Pedido processado localmente (backend retornou erro).';
        }
    } catch (err) {
        console.warn('Backend indisponível, usando fallback local.', err);
        orderSummary.message = 'Backend indisponível — pedido registrado localmente.';
    }

    // Salva resumo em sessionStorage para a página de confirmação
    sessionStorage.setItem('lastOrder', JSON.stringify(orderSummary));

    // Limpamos o carrinho local e atualizamos UI
    cart = { items: [], discountApplied: false };
    saveCart();
    updateCartUI();
    closeCart();

    // Redireciona para a página de confirmação
    window.location.href = 'checkout.html';
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
