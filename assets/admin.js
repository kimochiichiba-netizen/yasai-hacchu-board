/* やさい発注ボード — 管理画面ロジック（社長用） */
(function () {
  "use strict";
  const C = window.YasaiCommon;
  const store = window.YasaiStore;
  const PDF = window.YasaiPDF;
  const $ = (id) => document.getElementById(id);
  const month = C.currentMonth();

  let overrides = {};
  let current = null; // 開いている注文

  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---- ソフトロック（画面内ロック画面）----
   * 公開運用では Netlify のパスワード保護を併用してください（README参照）。
   * Promise を返し、解錠されたら resolve する。*/
  function gate() {
    const KEY = "yasai_admin_pass";
    return new Promise((resolve) => {
      const saved = localStorage.getItem(KEY);
      const first = !saved;
      const ov = document.createElement("div");
      ov.className = "modal-bg show";
      ov.style.alignItems = "center";
      ov.innerHTML = `
        <div class="modal" style="max-width:360px;text-align:center">
          <h2>🔒 管理画面</h2>
          <p class="muted" style="font-size:0.85rem">
            ${first ? "初回設定：パスコードを決めてください" : "パスコードを入力してください"}
          </p>
          <div class="field"><input id="passInput" type="password" autocomplete="off" placeholder="パスコード" /></div>
          <div id="passErr" style="color:#c62828;font-size:0.8rem;min-height:1em"></div>
          <button class="btn" id="passBtn" style="width:100%">${first ? "設定して入る" : "入る"}</button>
        </div>`;
      document.body.appendChild(ov);
      const input = ov.querySelector("#passInput");
      const err = ov.querySelector("#passErr");
      input.focus();
      const tryUnlock = () => {
        const val = input.value;
        if (!val) {
          err.textContent = "入力してください";
          return;
        }
        if (first) {
          localStorage.setItem(KEY, val);
          ov.remove();
          resolve(true);
        } else if (val === localStorage.getItem(KEY)) {
          ov.remove();
          resolve(true);
        } else {
          err.textContent = "パスコードが違います";
          input.value = "";
        }
      };
      ov.querySelector("#passBtn").addEventListener("click", tryUnlock);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") tryUnlock();
      });
    });
  }

  /* ---- タブ切替 ---- */
  function setupTabs() {
    document.querySelectorAll(".nav a[data-tab]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = a.dataset.tab;
        $("tab-orders").style.display = tab === "orders" ? "" : "none";
        $("tab-prices").style.display = tab === "prices" ? "" : "none";
        if (tab === "prices") renderPrices();
      });
    });
  }

  /* ---- 注文一覧 ---- */
  async function renderOrders() {
    let orders = [];
    try {
      orders = await store.listOrders();
    } catch (e) {
      console.error(e);
      showToast("注文の取得に失敗しました");
    }
    const body = $("ordersBody");
    body.innerHTML = "";
    if (!orders.length) {
      $("ordersEmpty").style.display = "";
      return;
    }
    $("ordersEmpty").style.display = "none";
    orders.forEach((o) => {
      const t = C.calcTotals(o.items || []);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.id.slice(-6)}</td>
        <td>${C.escapeHtml(o.partner)}</td>
        <td>${C.escapeHtml(o.orderDate || "")}</td>
        <td>${(o.items || []).length}</td>
        <td><span class="badge ${o.status}">${C.statusLabel(o.status)}</span></td>
        <td class="right">${t.subtotal ? C.yen(t.total) : "—"}</td>`;
      tr.addEventListener("click", () => openOrder(o.id));
      body.appendChild(tr);
    });
  }

  /* ---- 注文詳細モーダル ---- */
  async function openOrder(id) {
    current = await store.getOrder(id);
    if (!current) return;
    const o = current;
    const rows = (o.items || [])
      .map((it, i) => {
        const p = PRODUCTS.find((x) => x.id === it.productId);
        const std = p ? p.std : "";
        return `<tr>
          <td>${C.escapeHtml(it.name)}${it.variant ? "（" + C.escapeHtml(it.variant) + "）" : ""}</td>
          <td class="right">${it.qty} ${C.escapeHtml(it.unit || "")}</td>
          <td class="right">${it.wishPrice ? C.yen(it.wishPrice) : "—"}</td>
          <td><input type="number" min="0" data-idx="${i}" class="unitp" placeholder="${std}"
                value="${it.unitPrice != null ? it.unitPrice : ""}" /></td>
          <td class="right amt" data-idx="${i}">—</td>
        </tr>`;
      })
      .join("");

    $("modalContent").innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin:0">注文 ${o.id.slice(-6)}｜${C.escapeHtml(o.partner)}</h2>
        <button class="btn secondary small" id="closeModal">閉じる</button>
      </div>
      <p class="muted" style="font-size:0.85rem">
        注文日 ${C.escapeHtml(o.orderDate || "")}／入荷希望 ${C.escapeHtml(o.deliveryDate || "未指定")}
        ${o.contact ? "／連絡先 " + C.escapeHtml(o.contact) : ""}
      </p>
      ${o.note ? `<p style="background:#fffde7;padding:8px;border-radius:8px;font-size:0.85rem">備考：${C.escapeHtml(o.note)}</p>` : ""}
      <table class="list">
        <thead><tr><th>品目</th><th class="right">数量</th><th class="right">希望金額</th><th>確定単価(円)</th><th class="right">金額</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <table class="list" style="width:auto;margin-left:auto;margin-top:10px">
        <tr><td>小計</td><td class="right" id="mSub">—</td></tr>
        <tr><td>消費税(8%)</td><td class="right" id="mTax">—</td></tr>
        <tr><td><strong>合計</strong></td><td class="right"><strong id="mTotal">—</strong></td></tr>
      </table>
      <div class="btnbar">
        <button class="btn" id="saveBtn">単価を保存</button>
        <button class="btn secondary" id="deliveryBtn">📄 納品書PDF</button>
        <button class="btn accent" id="invoiceBtn">🧾 請求書PDF</button>
        <button class="btn secondary" id="doneBtn">✅ 発行済にする</button>
      </div>`;

    $("modal").classList.add("show");
    $("closeModal").addEventListener("click", closeModal);
    $("saveBtn").addEventListener("click", savePrices);
    $("deliveryBtn").addEventListener("click", () => issue("delivery"));
    $("invoiceBtn").addEventListener("click", () => issue("invoice"));
    $("doneBtn").addEventListener("click", markDone);

    $("modalContent").addEventListener("input", (e) => {
      if (e.target.classList.contains("unitp")) recalc();
    });
    recalc();
  }

  function readUnitPrices() {
    document.querySelectorAll(".unitp").forEach((inp) => {
      const idx = Number(inp.dataset.idx);
      current.items[idx].unitPrice = inp.value === "" ? null : Number(inp.value);
    });
  }

  function recalc() {
    readUnitPrices();
    current.items.forEach((it, i) => {
      const cell = document.querySelector(`.amt[data-idx="${i}"]`);
      const amt = (Number(it.unitPrice) || 0) * (Number(it.qty) || 0);
      if (cell) cell.textContent = it.unitPrice ? C.yen(amt) : "—";
    });
    const t = C.calcTotals(current.items);
    $("mSub").textContent = C.yen(t.subtotal);
    $("mTax").textContent = C.yen(t.tax);
    $("mTotal").textContent = C.yen(t.total);
  }

  async function savePrices() {
    readUnitPrices();
    const anyPriced = current.items.some((it) => it.unitPrice != null);
    await store.updateOrder(current.id, {
      items: current.items,
      status: anyPriced ? "priced" : current.status,
    });
    current.status = anyPriced ? "priced" : current.status;
    showToast("単価を保存しました");
    renderOrders();
  }

  function issue(kind) {
    readUnitPrices();
    const priced = current.items.some((it) => it.unitPrice != null);
    if (!priced) {
      showToast("先に確定単価を入力してください");
      return;
    }
    PDF.printDoc(kind === "invoice" ? "invoice" : "delivery", current);
  }

  async function markDone() {
    readUnitPrices();
    await store.updateOrder(current.id, { items: current.items, status: "done" });
    current.status = "done";
    showToast("発行済にしました");
    closeModal();
    renderOrders();
  }

  function closeModal() {
    $("modal").classList.remove("show");
    current = null;
  }

  /* ---- 旬・価格調整 ---- */
  function renderPrices() {
    const ov = store.getProductOverrides();
    const body = $("pricesBody");
    body.innerHTML = "";
    PRODUCTS.forEach((p) => {
      const auto = C.autoTrend(p, month);
      const cur = overrides[p.id] || "auto";
      const stdVal = (ov[p.id] && ov[p.id].std != null) ? ov[p.id].std : p.std;
      const tr = document.createElement("tr");
      tr.style.cursor = "default";
      tr.innerHTML = `
        <td>${C.escapeHtml(p.name)}</td>
        <td>${auto.icon} ${auto.label}</td>
        <td>
          <select data-id="${p.id}" class="ovsel">
            <option value="auto"${cur === "auto" ? " selected" : ""}>自動</option>
            <option value="cheap"${cur === "cheap" ? " selected" : ""}>📉 安い</option>
            <option value="high"${cur === "high" ? " selected" : ""}>📈 高い</option>
          </select>
        </td>
        <td><input type="number" min="0" data-id="${p.id}" class="stdp" value="${stdVal}" style="width:110px" /></td>`;
      body.appendChild(tr);
    });

    body.querySelectorAll(".ovsel").forEach((sel) => {
      sel.addEventListener("change", async () => {
        await store.setOverride(sel.dataset.id, sel.value);
        overrides = await store.getOverrides();
        showToast("おすすめ表示を更新しました");
      });
    });
    body.querySelectorAll(".stdp").forEach((inp) => {
      inp.addEventListener("change", () => {
        store.setProductOverride(inp.dataset.id, { std: Number(inp.value) || 0 });
        showToast("標準単価を更新しました");
      });
    });
  }

  async function init() {
    await gate();
    setupTabs();
    try {
      overrides = await store.getOverrides();
    } catch (e) {
      console.error(e);
    }
    await renderOrders();
    $("modeNote").textContent =
      store.mode === "supabase"
        ? "共有モード：全端末の注文を表示しています"
        : "デモモード：この端末内の注文のみ表示（共有設定で全店舗の注文が集約されます）";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
