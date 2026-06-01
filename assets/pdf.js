/* やさい発注ボード — 納品書・請求書のHTML生成（ブラウザ印刷でPDF化） */
(function () {
  "use strict";
  const C = window.YasaiCommon;

  // 自社情報（社長が必要に応じて書き換え）
  const COMPANY = {
    name: "株式会社気持ち市場",
    addr: "〒870-0034 大分県大分市都町2-6-6",
    tel: "080-4314-8120",
    regno: "T5320001018401", // インボイス登録番号
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

  /* 同一ページに全画面オーバーレイで表示し、PDFを生成して
   * iPhoneの共有メニュー（LINE・メール等）へ直接渡す。
   * - iPhoneは pdf.save() のダウンロードが「どこに保存されたか分からない」ため、
   *   navigator.share でPDFファイルを共有シートに乗せるのが唯一確実な送付/保存方法。
   * - 共有ファイルが使えない端末（PC等）はダウンロード保存にフォールバック。
   * - 印刷したい人向けに「印刷」ボタンも併設。 */
  function printDoc(kind, order) {
    const html = buildDoc(kind, order);
    const old = document.getElementById("print-overlay");
    if (old) old.remove();

    const docLabel = kind === "invoice" ? "請求書" : "納品書";
    const fileBase =
      docLabel +
      "_" +
      (order.partner || "").replace(/[\\/:*?"<>|\s]+/g, "") +
      "_" +
      String(order.id || "").slice(-6);
    const shareTitle = docLabel + "（" + (order.partner || "") + "様）";

    const ov = document.createElement("div");
    ov.id = "print-overlay";
    ov.innerHTML =
      "<style>" +
      "#print-overlay{position:fixed;inset:0;z-index:99999;background:#f3f5f3;overflow:auto;-webkit-overflow-scrolling:touch}" +
      "#print-overlay .pbar{position:sticky;top:0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:12px;background:#2e7d32;box-shadow:0 2px 8px rgba(0,0,0,.2)}" +
      "#print-overlay .pbar button{font-size:1rem;padding:12px 22px;border:0;border-radius:10px;font-weight:700;cursor:pointer;-webkit-appearance:none}" +
      "#print-overlay .pbar button:disabled{opacity:.6}" +
      "#print-overlay .pbtn{background:#fff;color:#2e7d32}" +
      "#print-overlay .ibtn{background:rgba(255,255,255,.22);color:#fff}" +
      "#print-overlay .cbtn{background:rgba(255,255,255,.22);color:#fff}" +
      "#print-overlay .hint{font-size:.8rem;color:#fff;text-align:center;padding:0 12px 9px;background:#2e7d32}" +
      "#print-overlay .sheet{max-width:720px;margin:16px auto;background:#fff;padding:24px;box-shadow:0 2px 14px rgba(0,0,0,.15)}" +
      "@media print{body>*:not(#print-overlay){display:none!important}" +
      "#print-overlay{position:static!important;overflow:visible!important;background:#fff!important}" +
      "#print-overlay .pbar,#print-overlay .hint{display:none!important}" +
      "#print-overlay .sheet{max-width:none;margin:0;padding:0;box-shadow:none}}" +
      "</style>" +
      '<div class="pbar">' +
      '<button class="pbtn" id="poShare">📤 LINE・メールで送る</button>' +
      '<button class="ibtn" id="poPrint">🖨 印刷</button>' +
      '<button class="cbtn" id="poClose">✕ 閉じる</button>' +
      "</div>" +
      '<div class="hint" id="poHint">「📤 LINE・メールで送る」を押すとPDFを作成し、送り先（LINE・メール等）を選べます（数秒かかります）。</div>' +
      '<div class="sheet" id="poSheet">' +
      html +
      "</div>";

    document.body.appendChild(ov);
    ov.scrollTop = 0;

    document.getElementById("poClose").addEventListener("click", function () {
      ov.remove();
    });
    document.getElementById("poPrint").addEventListener("click", function () {
      window.print();
    });
    document.getElementById("poShare").addEventListener("click", function () {
      sharePdf(fileBase, shareTitle);
    });
  }

  /* オーバーレイ内の納品書/請求書をPDF化し、iPhoneの共有シート（LINE・メール等）へ渡す。
   * 共有ファイル非対応の端末ではダウンロード保存にフォールバックする。 */
  async function sharePdf(fileBase, shareTitle) {
    const sheet = document.getElementById("poSheet");
    const btn = document.getElementById("poShare");
    const hint = document.getElementById("poHint");
    if (!sheet) return;
    const JsPDF =
      (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
    const hasLibs = typeof window.html2canvas === "function" && JsPDF;
    if (!hasLibs) {
      if (hint) hint.textContent = "PDF作成の準備ができていないため、印刷画面を開きます。";
      window.print();
      return;
    }
    try {
      if (btn) { btn.disabled = true; btn.textContent = "📤 作成中…"; }
      if (hint) hint.textContent = "PDFを作成しています。そのままお待ちください…";

      const canvas = await window.html2canvas(sheet, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgW, imgH);
      } else {
        // 1ページに収まらない場合は複数ページに分割
        let sY = 0;
        const pxPerMm = canvas.width / imgW;
        const pageImgPx = (pageH - margin * 2) * pxPerMm;
        while (sY < canvas.height) {
          const sliceH = Math.min(pageImgPx, canvas.height - sY);
          const part = document.createElement("canvas");
          part.width = canvas.width;
          part.height = sliceH;
          part.getContext("2d").drawImage(canvas, 0, sY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          if (sY > 0) pdf.addPage();
          pdf.addImage(part.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgW, sliceH / pxPerMm);
          sY += sliceH;
        }
      }

      const blob = pdf.output("blob");
      const fileName = fileBase + ".pdf";
      const file = new File([blob], fileName, { type: "application/pdf" });

      // iPhone等：共有シート（LINE・メール等）へPDFを直接渡す
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle, text: shareTitle });
          if (hint) hint.textContent = "送信先を選んでください（送らない場合はキャンセルでOK）。";
          return;
        } catch (err) {
          if (err && err.name === "AbortError") {
            // 社長がキャンセルしただけ → 何もしない
            if (hint) hint.textContent = "キャンセルしました。もう一度「📤 LINE・メールで送る」を押せます。";
            return;
          }
          // 共有に失敗 → ダウンロードにフォールバック
        }
      }

      // PC等（共有ファイル非対応）：ダウンロード保存
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      if (hint) hint.textContent = "PDFをダウンロードしました（パソコンは「ダウンロード」フォルダをご確認ください）。";
    } catch (e) {
      console.error("PDF作成に失敗:", e);
      if (hint) hint.textContent = "PDF作成に失敗したため、印刷画面を開きます。";
      window.print();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "📤 LINE・メールで送る"; }
    }
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
