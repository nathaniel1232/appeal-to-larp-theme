(function () {
  const T = window.theme;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Money ---------- */
  function formatMoney(cents) {
    const fmt = T.moneyFormat || "${{amount}}";
    const n = (cents / 100).toFixed(2);
    const withDelims = (num, thou, dec) => { const [a, b] = num.split("."); return a.replace(/\B(?=(\d{3})+(?!\d))/g, thou) + (b ? dec + b : ""); };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => {
      if (k === "amount_no_decimals") return withDelims(Math.round(cents / 100).toString(), ",", ".");
      if (k === "amount_with_comma_separator") return withDelims(n, ".", ",");
      if (k === "amount_no_decimals_with_comma_separator") return withDelims(Math.round(cents / 100).toString(), ".", ",");
      return withDelims(n, ",", ".");
    });
  }

  /* ---------- Toast, modal ---------- */
  let tt;
  function toast(msg) { const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400); }
  function modal(html) {
    $("#modalCard").innerHTML = `<button class="icon-btn modal-x" aria-label="Close"><svg viewBox="0 0 24 24" class="i"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` + html;
    $("#modal").classList.add("open");
  }
  $("#modal")?.addEventListener("click", (e) => {
    if (e.target.id === "modal" || e.target.closest(".modal-x")) $("#modal").classList.remove("open");
  });

  /* ---------- Cart drawer ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const openCart = () => { document.body.classList.add("cart-open"); $("#drawer")?.setAttribute("aria-hidden", "false"); };
  const closeCart = () => { document.body.classList.remove("cart-open"); $("#drawer")?.setAttribute("aria-hidden", "true"); };
  let cartState = null;

  async function fetchCart() { cartState = await (await fetch(T.routes.cart + ".js")).json(); renderCart(); return cartState; }

  function renderCart() {
    const c = cartState; if (!c || !$("#drawer")) return;
    const count = $("#cartCount");
    count.textContent = c.item_count; count.classList.toggle("show", c.item_count > 0);
    const left = T.freeShippingAt - c.total_price, pct = T.freeShippingAt ? Math.min(100, (c.total_price / T.freeShippingAt) * 100) : 100;
    $("#shipBar").innerHTML = c.item_count && T.freeShippingAt
      ? `<p>${left > 0 ? `You are <b>${formatMoney(left)}</b> away from free shipping` : `<b>You unlocked free shipping</b>`}</p><div class="bar"><span style="width:${pct}%"></span></div>`
      : "";
    if (!c.item_count) {
      $("#drawerBody").innerHTML = $("#cartEmpty").innerHTML;
      $("#drawerFoot").innerHTML = "";
      return;
    }
    $("#drawerBody").innerHTML = c.items.map((it, i) => `
      <div class="line">
        <a href="${it.url}" class="line-thumb">${it.image ? `<img src="${it.image + (it.image.includes("?") ? "&" : "?") + "width=300"}" alt="${esc(it.product_title)}" loading="lazy">` : ""}</a>
        <div class="line-info">
          <a href="${it.url}" class="line-name">${esc(it.product_title)}</a>
          ${it.variant_title ? `<span class="muted">${esc(it.variant_title)}</span>` : ""}
          <div class="line-row">
            <div class="stepper sm"><button data-line="${i + 1}" data-q="${it.quantity - 1}" aria-label="Decrease">−</button><span>${it.quantity}</span><button data-line="${i + 1}" data-q="${it.quantity + 1}" aria-label="Increase">+</button></div>
            <span>${formatMoney(it.final_line_price)}</span>
          </div>
          <button class="link-btn" data-line="${i + 1}" data-q="0">Remove</button>
        </div>
      </div>`).join("");
    $("#drawerFoot").innerHTML = `<div class="sum"><span>Subtotal</span><span>${formatMoney(c.total_price)}</span></div>
      <p class="muted small">Taxes and shipping calculated at checkout.</p>
      <a href="/checkout" class="btn btn-dark btn-block">Checkout · ${formatMoney(c.total_price)}</a>${$("#cartTrust").innerHTML}`;
    updateShipNote();
  }

  async function changeLine(line, quantity) {
    $("#drawer").classList.add("busy");
    const r = await fetch(T.routes.cartChange + ".js", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ line, quantity }) });
    cartState = await r.json();
    $("#drawer").classList.remove("busy");
    renderCart();
  }

  async function addToCart(id, quantity = 1, btn) {
    btn && btn.classList.add("loading");
    try {
      const r = await fetch(T.routes.cartAdd + ".js", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ items: [{ id: +id, quantity: +quantity }] }) });
      const data = await r.json();
      if (!r.ok) { toast(data.description || "Could not add to cart"); return; }
      await fetchCart();
      const count = $("#cartCount"); count.classList.remove("bump"); void count.offsetWidth; count.classList.add("bump");
      openCart();
    } finally { btn && btn.classList.remove("loading"); }
  }

  $("#cartBtn")?.addEventListener("click", (e) => { if (T.isCartPage) return; e.preventDefault(); openCart(); });
  $("#closeCart")?.addEventListener("click", closeCart);
  $("#scrim")?.addEventListener("click", closeCart);
  $("#drawer")?.addEventListener("click", (e) => { const b = e.target.closest("[data-line]"); if (b) changeLine(+b.dataset.line, +b.dataset.q); });
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-quick-add]"); if (b) { e.preventDefault(); addToCart(b.dataset.quickAdd, 1, b); } });
  T.isCartPage = document.body.dataset.template === "cart";

  /* ---------- Product page ---------- */
  function updateShipNote() {
    const note = $("#shipNote"); if (!note || !cartState || !T.freeShippingAt) return;
    const qty = +($("#qty")?.value || 1), left = T.freeShippingAt - cartState.total_price - (+note.dataset.price) * qty;
    note.innerHTML = left > 0 ? `Add <b>${formatMoney(left)}</b> more for free shipping` : `<b>This order ships free</b>`;
  }

  function initProduct(root) {
    const json = $("#productJson", root); if (!json) return;
    const product = JSON.parse(json.textContent);
    const form = $("#productForm", root), idInput = $("#variantId", root), addBtn = $("#addBtn", root), qty = $("#qty", root);
    const selected = $$(".opt", root).map((o) => $(".on", o)?.dataset.value);

    function current() { return product.variants.find((v) => v.options.every((o, i) => o === selected[i])); }
    function update() {
      const v = current();
      $$(".opt", root).forEach((o, i) => {
        $$("[data-value]", o).forEach((b) => b.classList.toggle("on", b.dataset.value === selected[i]));
        $("[data-option-label]", o).textContent = selected[i];
      });
      if (!v) { addBtn.disabled = true; addBtn.textContent = "Unavailable"; return; }
      idInput.value = v.id;
      addBtn.disabled = !v.available;
      addBtn.textContent = v.available ? `Add to cart · ${formatMoney(v.price * (+qty.value || 1))}` : "Sold out";
      $("#pdpPrice", root).innerHTML = (v.compare_at_price > v.price ? `<s>${formatMoney(v.compare_at_price)}</s>` : "") + `<span>${formatMoney(v.price)}</span>`;
      $("#sbPrice") && ($("#sbPrice").textContent = `${v.title} · ${formatMoney(v.price)}`);
      $("#shipNote") && ($("#shipNote").dataset.price = v.price);
      if (v.featured_media) showImage(v.featured_media.preview_image.src, v.featured_media.id);
      const url = new URL(location.href); url.searchParams.set("variant", v.id); history.replaceState(null, "", url);
      updateShipNote();
    }
    function showImage(src, mediaId) {
      const img = $("#mainImage", root); if (!img) return;
      img.removeAttribute("srcset"); img.src = src.includes("?") ? src + "&width=1600" : src + "?width=1600";
      $$("[data-thumb]", root).forEach((t) => t.classList.toggle("on", +t.dataset.mediaId === +mediaId));
    }

    root.addEventListener("click", (e) => {
      const opt = e.target.closest(".opt [data-value]");
      if (opt) { selected[+opt.closest(".opt").dataset.optionIndex] = opt.dataset.value; update(); }
      const step = e.target.closest("[data-qty]");
      if (step) { qty.value = Math.max(1, (+qty.value || 1) + +step.dataset.qty); update(); }
      const th = e.target.closest("[data-thumb]");
      if (th) showImage(th.dataset.thumb, th.dataset.mediaId);
      if (e.target.closest("[data-sizeguide]")) modal($("#sizeGuide").innerHTML);
    });
    qty.addEventListener("change", update);
    form.addEventListener("submit", (e) => { e.preventDefault(); addToCart(idInput.value, qty.value, addBtn); });
    $("#sbAdd")?.addEventListener("click", () => addToCart(idInput.value, qty.value, $("#sbAdd")));
    const sticky = $("#stickyBuy");
    if (sticky) new IntersectionObserver(([en]) => sticky.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0)).observe(addBtn);
    update();
  }

  /* ---------- Collection sort ---------- */
  $("[data-sort]")?.addEventListener("change", (e) => { const u = new URL(location.href); u.searchParams.set("sort_by", e.target.value); u.searchParams.delete("page"); location.href = u; });

  /* ---------- Shell ---------- */
  function reveal(root = document) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal", root).forEach((el) => io.observe(el));
  }
  $("#menuBtn")?.addEventListener("click", () => { const on = document.body.classList.toggle("nav-open"); $("#menuBtn").setAttribute("aria-expanded", on); });
  window.addEventListener("scroll", () => $("#header")?.classList.toggle("scrolled", scrollY > 10), { passive: true });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); $("#modal")?.classList.remove("open"); } });
  document.addEventListener("shopify:section:load", (e) => { reveal(e.target); $("[data-product]", e.target) && initProduct($("[data-product]", e.target)); });

  reveal();
  $("[data-product]") && initProduct($("[data-product]"));
  fetchCart();
})();
