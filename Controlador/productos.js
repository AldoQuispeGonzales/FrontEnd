const API = "http://54.233.82.51:3000/api";

let PRODUCTS = [];
const cart = JSON.parse(localStorage.getItem("cart") || "{}");

function $(id) {
    return document.getElementById(id);
}

// 🔹 Obtener productos desde API
async function fetchProducts() {
    try {
        const res = await fetch(API + "/productos");
        PRODUCTS = await res.json();
        renderProducts(PRODUCTS);
    } catch (e) {
        console.error("Error al obtener productos", e);
    }
}

// 🔹 Renderizar productos
function renderProducts(list) {
    const container = $("products");
    container.innerHTML = "";
    list.forEach((p) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
      <img src="${p.imagen_url || "/assets/placeholder-product.jpg"}" alt="${p.nombre}" />
      <h4>${p.nombre}</h4>
      <div class="muted">${p.descripcion || ""}</div>
      <div class="price">S/ ${Number(p.precio).toFixed(2)}</div>
      <div style="margin-top:.6rem">
        <button data-id="${p.id}" class="addBtn">Agregar</button>
      </div>
    `;
        container.appendChild(card);
    });
}

// 🔹 Contador carrito
function updateCartCount() {
    const count = Object.values(cart).reduce((s, q) => s + q, 0);
    $("cartCount").textContent = count;
}

// 🔹 Agregar al carrito
function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

// 🔹 Mostrar carrito
function renderCartItems() {
    const cartItems = $("cartItems");
    cartItems.innerHTML = "";

    if (Object.keys(cart).length === 0) {
        cartItems.innerHTML = "<p>Carrito vacío</p>";
        return;
    }

    Object.entries(cart).forEach(([id, qty]) => {
        const product = PRODUCTS.find((p) => p.id == id);
        if (!product) return;

        const item = document.createElement("div");
        item.className = "cart-item";
        item.innerHTML = `
      <strong>${product.nombre}</strong>
      (x${qty}) - S/ ${(product.precio * qty).toFixed(2)}
    `;
        cartItems.appendChild(item);
    });
}

// 🔹 Eventos
function bindUI() {
    document.addEventListener("click", (e) => {
        if (e.target.matches(".addBtn")) addToCart(e.target.dataset.id);
        if (e.target.id === "cartBtn") {
            renderCartItems();
            $("cartModal").classList.remove("hidden");
        }
        if (e.target.id === "closeCart") $("cartModal").classList.add("hidden");
        if (e.target.id === "checkoutBtn") startCheckout();
    });

    $("searchInput").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        renderProducts(
            PRODUCTS.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(q) ||
                    (p.descripcion || "").toLowerCase().includes(q)
            )
        );
    });

    // Como aún no tienes columna "categoria", solo recargamos todo
    $("categoryFilter").addEventListener("change", () => {
        renderProducts(PRODUCTS);
    });

    $("priceRange").addEventListener("input", (e) => {
        $("priceVal").textContent = e.target.value;
        renderProducts(PRODUCTS.filter((p) => Number(p.precio) <= Number(e.target.value)));
    });
}

// 🔹 Checkout simulado
function startCheckout() {
    const items = Object.entries(cart).map(([id, qty]) => ({
        product_id: id,
        quantity: qty,
    }));
    if (items.length === 0) return alert("Carrito vacío");

    fetch(API + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: "Cliente Demo", items }),
    })
        .then((r) => r.json())
        .then((res) => {
            alert("Pedido creado: " + res.order_id);
            localStorage.removeItem("cart");
            for (let k in cart) delete cart[k];
            updateCartCount();
            $("cartModal").classList.add("hidden");
        })
        .catch(() => alert("Error al pagar"));
}

// 🔹 Inicialización
fetchProducts();
bindUI();
updateCartCount();
