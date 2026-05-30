/* やさい発注ボード — 納品書・請求書のHTML生成（ブラウザ印刷でPDF化） */
(function () {
  "use strict";
  const C = window.YasaiCommon;

  // 自社情報（社長が必要に応じて書き換え）
  const COMPANY = {
    name: "株式会社気持ち市場",
    addr: "大分県大分市都町",
    tel: "",
    regno: "", // インボイス登録番号（任意）
  };

  function itemsRows(items, noPrice) {
    return items
      .map((it) => {
        const unit = Number(it.unitPrice) || 0;
        const qty = Number(it.qty) || 0;
        const amount = unit * qty;
        const nameCell =
          C.escapeHtml(it.name) + (it.variant ? `（${C.escapeHtml(it.variant)}）` : "");
        if (noPrice) {
          // 金額なし納品書：品目・数量・サイズ/品種のみ
          return `<tr>
            <td>${nameCell}</td>
            <td class="right">${qty} ${C.escapeHtml(it.unit || "")}</td>
            <td>${C.escapeHtml(it.variant || "")}</td>
          </tr>`;
        }
        return `<tr>
          <td>${nameCell}</td>
          <td class="right">${qty} ${C.escapeHtml(it.unit || "")}</td>
          <td class="right">${unit ? C.yen(unit) : "—"}</td>
          <td class="right">${unit ? C.yen(amount) : "—"}</td>
        </tr>`;
      })
      .join("");
  }

  function buildDoc(kind, order) {
    const noPrice = kind === "delivery_noprice";
    const isInvoice = kind === "invoice";
    const t = C.calcTotals(order.items);
    const title = isInvoice ? "請 求 書" : noPrice ? "納 品 書" : "納 品 書";
    const dateLabel = isInvoice ? "請求日" : "納品日";
    const dateVal = isInvoice ? C.todayLocal() : order.deliveryDate || C.todayLocal();
    return `
      <div class="doc">
        <style>
          .doc { font-family: "Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif; color:#1f2a1f; }
          .doc h1 { text-align:center; letter-spacing:0.3em; font-size:1.6rem; margin:0 0 18px; }
          .doc .head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
          .doc .to { font-size:1.1rem; border-bottom:2px solid #1f2a1f; padding-bottom:4px; min-width:240px; }
          .doc .to small { display:block; font-size:0.75rem; color:#6b766b; border:none; }
          .doc .from { text-align:right; font-size:0.85rem; line-height:1.5; }
          .doc .meta { font-size:0.85rem; margin-bottom:10px; }
          .doc table { width:100%; border-collapse:collapse; margin-top:8px; }
          .doc th, .doc td { border:1px solid #9bb09b; padding:7px 9px; font-size:0.88rem; }
          .doc th { background:#e8f5e9; }
          .doc .right { text-align:right; }
          .doc .totals { margin-top:14px; width:48%; margin-left:52%; }
          .doc .totals td { border:none; padding:4px 9px; }
          .doc .totals .grand { font-size:1.2rem; font-weight:700; border-top:2px solid #1f2a1f; }
          .doc .note { margin-top:16px; font-size:0.8rem; color:#444; white-space:pre-wrap; }
          .doc .seal { font-size:0.75rem; color:#6b766b; margin-top:24px; }
        </style>
        <h1>${title}</h1>
        <div class="head">
          <div>
            <div class="to">${C.escapeHtml(order.partner || "")} 御中
              <small>${C.escapeHtml(order.contact || "")}</small></div>
            <div class="meta" style="margin-top:10px">
              ${dateLabel}：${dateVal}<br />
              注文番号：${C.escapeHtml(order.id)}
            </div>
          </div>
          <div class="from">
            <strong>${COMPANY.name}</strong><br />
            ${COMPANY.addr}<br />
            ${COMPANY.tel ? "TEL " + COMPANY.tel + "<br/>" : ""}
            ${COMPANY.regno ? "登録番号 " + COMPANY.regno : ""}
          </div>
        </div>
        ${isInvoice
          ? `<div class="meta">下記の通りご請求申し上げます。</div>`
          : noPrice
            ? `<div class="meta">下記の通り納品いたします。（お代金は後日ご請求いたします）</div>`
            : `<div class="meta">下記の通り納品いたします。</div>`}
        <table>
          <thead>
            ${noPrice
              ? `<tr><th>品目</th><th class="right">数量</th><th>サイズ・品種</th></tr>`
              : `<tr><th>品目</th><th class="right">数量</th><th class="right">単価</th><th class="right">金額</th></tr>`}
          </thead>
          <tbody>${itemsRows(order.items, noPrice)}</tbody>
        </table>
        ${noPrice
          ? `<div class="note" style="margin-top:18px">※ 金額は記載していません（後日、確定単価で請求書を発行します）。</div>`
          : `<table class="totals">
          <tr><td>小計</td><td class="right">${C.yen(t.subtotal)}</td></tr>
          <tr><td>消費税(8% 軽減税率)</td><td class="right">${C.yen(t.tax)}</td></tr>
          <tr class="grand"><td>合計</td><td class="right">${C.yen(t.total)}</td></tr>
        </table>`}
        ${order.note ? `<div class="note">備考：${C.escapeHtml(order.note)}</div>` : ""}
        ${isInvoice ? `<div class="seal">※ 食品（軽減税率8%対象）。本書はインボイス制度の適格請求書様式に準じています。</div>` : `<div class="seal">※ 食品（軽減税率8%対象）。</div>`}
      </div>`;
  }

  // 別ウィンドウで開いて印刷（本体ページの余白で白紙が大量に出る不具合を回避）
  function printDoc(kind, order) {
    const html = buildDoc(kind, order);
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      alert("印刷ウィンドウがブロックされました。ブラウザのポップアップを許可してください。");
      return;
    }
    w.document.write(
      '<!doctype html><html lang="ja"><head><meta charset="utf-8" />' +
        "<title>" +
        (kind === "invoice" ? "請求書" : "納品書") +
        "</title></head><body style='margin:18px'>" +
        html +
        "</body></html>"
    );
    w.document.close();
    w.focus();
    setTimeout(function () {
      w.print();
    }, 350);
  }

  // メール／LINE貼り付け用のテキスト版納品書
  function buildText(kind, order) {
    const t = C.calcTotals(order.items);
    const L = [];
    L.push("【納品書】" + COMPANY.name);
    L.push((order.partner || "") + " 御中");
    L.push("納品日：" + (order.deliveryDate || C.todayLocal()) + "　注文番号：" + order.id.slice(-6));
    L.push("──────────────");
    order.items.forEach((it) => {
      const unit = Number(it.unitPrice) || 0;
      const qty = Number(it.qty) || 0;
      const nm = it.name + (it.variant ? "（" + it.variant + "）" : "");
      L.push(nm + "　" + qty + (it.unit || "") + "　単価" + (unit ? C.yen(unit) : "未定") + "　" + (unit ? C.yen(unit * qty) : "—"));
    });
    L.push("──────────────");
    L.push("小計：" + C.yen(t.subtotal));
    L.push("消費税(8%)：" + C.yen(t.tax));
    L.push("合計：" + C.yen(t.total));
    if (order.note) L.push("備考：" + order.note);
    L.push("");
    L.push(COMPANY.name + (COMPANY.tel ? "　TEL " + COMPANY.tel : ""));
    return L.join("\n");
  }

  window.YasaiPDF = { buildDoc, printDoc, buildText, COMPANY };
})();
