/* やさい発注ボード — 発注画面ロジック（取引先用） */
(function () {
  "use strict";
  const C = window.YasaiCommon;
  const store = window.YasaiStore;

  const $ = (id) => document.getElementById(id);
  const month = C.currentMonth();

  // 価格傾向の手動上書き（共有モードなら社長の設定を反映）
  let overrides = {};

  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }

  function effectiveProducts() {
    const ov = store.getProductOverrides();
    return PRODUCTS.map((p) => Object.assign({}, p, ov[p.id] || {}));
  }

  function renderReco(products) {
    const { cheap, up } = C.buildRecommendations(products, overrides, month);
    const chip = (x) =>
      `<span class="chip">${C.escapeHtml(x.p.name)} <small>${x.t.icon}</small></span>`;
    $("reco").innerHTML = `
      <div class="box cheap">
        <h3>📉 今が買い時の野菜（${month}月）</h3>
        <div class="chips">${cheap.length ? cheap.map(chip).join("") : '<span class="muted">該当なし</span>'}</div>
      </div>
      <div class="box up">
        <h3>📈 これから高くなりそう</h3>
        <div class="chips">${up.length ? up.map(chip).join("") : '<span class="muted">該当なし</span>'}</div>
      </div>`;
  }

  function renderCatalog(products) {
    const host = $("catalog");
    host.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const items = products.filter((p) => p.cat === cat.key);
      if (!items.length) return;
      const title = document.createElement("div");
      title.className = "cat-title";
      title.textContent = cat.label;
      host.appendChild(title);

      items.forEach((p) => {
        const t = C.effectiveTrend(p, overrides, month);
        const tagClass = t.trend === "cheap" || t.trend === "soon-cheap" ? "cheap" : t.trend === "soon-up" ? "up" : "";
        const tag = tagClass ? `<span class="tag ${tagClass}">${t.icon} ${t.label}</span>` : "";
        const variantSel = (p.variants && p.variants.length)
          ? `<select data-role="variant"><option value="">品種/サイズ</option>${p.variants.map((v) => `<option>${C.escapeHtml(v)}</option>`).join("")}</select>`
          : `<input data-role="variant" placeholder="サイズ/品種" />`;
        const unitOpts = (p.units || ["個"]).map((u) => `<option>${C.escapeHtml(u)}</option>`).join("");

        const row = document.createElement("div");
        row.className = "item-row";
        row.dataset.id = p.id;
        row.innerHTML = `
          <div class="name">${C.escapeHtml(p.name)} ${tag}
            ${p.note ? `<span class="note">${C.escapeHtml(p.note)}</span>` : ""}</div>
          <div>
            <span class="colhead">数量</span>
            <div style="display:flex;gap:4px">
              <input data-role="qty" type="number" min="0" inputmode="numeric" placeholder="0" style="width:60%" />
              <select data-role="unit" style="width:40%">${unitOpts}</select>
            </div>
          </div>
          <div><span class="colhead">サイズ/品種</span>${variantSel}</div>
          <div><span class="colhead">希望金額(円)</span>
            <input data-role="price" type="number" min="0" inputmode="numeric" placeholder="例:${p.std}" /></div>`;
        host.appendChild(row);
      });
    });

    host.addEventListener("input", (e) => {
      const row = e.target.closest(".item-row");
      if (!row) return;
      const qty = Number(row.querySelector('[data-role="qty"]').value) || 0;
      row.classList.toggle("has-qty", qty > 0);
      updateCount();
    });
  }

  function collectItems() {
    const items = [];
    document.querySelectorAll(".item-row").forEach((row) => {
      const qty = Number(row.querySelector('[data-role="qty"]').value) || 0;
      if (qty <= 0) return;
      const p = PRODUCTS.find((x) => x.id === row.dataset.id);
      items.push({
        productId: row.dataset.id,
        name: p ? p.name : row.dataset.id,
        qty,
        unit: row.querySelector('[data-role="unit"]').value || "",
        variant: row.querySelector('[data-role="variant"]').value || "",
        wishPrice: Number(row.querySelector('[data-role="price"]').value) || null,
        unitPrice: null, // 社長が確定
      });
    });
    return items;
  }

  function updateCount() {
    const n = collectItems().length;
    $("count").textContent = `選択 ${n} 品目`;
  }

  async function submit() {
    // ハニーポット（ボットなら値が入る）
    if ($("website").value) return;
    const partner = $("partner").value.trim();
    if (!partner) {
      showToast("店舗・会社名を入力してください");
      $("partner").focus();
      return;
    }
    const items = collectItems();
    if (!items.length) {
      showToast("数量を入れた品目がありません");
      return;
    }
    const btn = $("submitBtn");
    btn.disabled = true;
    try {
      const order = await store.createOrder({
        partner,
        contact: $("contact").value.trim(),
        orderDate: $("orderDate").value,
        deliveryDate: $("deliveryDate").value,
        note: $("note").value.trim(),
        items,
      });
      // 送信完了パネル
      $("afterMsg").textContent =
        "注文番号 " + order.id.slice(-6) + "（" + order.items.length + "品目）を受け付けました。ありがとうございます。";
      $("afterSubmit").classList.add("show");
      $("closeAfter").onclick = function () {
        $("afterSubmit").classList.remove("show");
      };
      // 入力リセット
      document.querySelectorAll(".item-row").forEach((row) => {
        row.querySelector('[data-role="qty"]').value = "";
        row.querySelector('[data-role="price"]').value = "";
        row.classList.remove("has-qty");
      });
      $("note").value = "";
      updateCount();
    } catch (e) {
      console.error(e);
      showToast("送信に失敗しました。もう一度お試しください");
    } finally {
      btn.disabled = false;
    }
  }

  async function init() {
    $("orderDate").value = C.todayLocal();
    try {
      overrides = await store.getOverrides();
    } catch (e) {
      console.error("価格傾向の取得に失敗:", e);
    }
    const products = effectiveProducts();
    renderReco(products);
    renderCatalog(products);
    updateCount();
    $("submitBtn").addEventListener("click", submit);
    $("modeNote").textContent =
      store.mode === "supabase"
        ? "共有モード：注文は気持ち市場に届きます"
        : "デモモード：この端末内に保存されます（共有設定で本番連携できます）";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
