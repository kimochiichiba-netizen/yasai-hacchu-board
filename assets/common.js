/* やさい発注ボード — 共通ロジック（旬判定・税計算・整形） */
(function () {
  "use strict";

  const TAX_RATE = 0.08; // 食品は軽減税率8%

  function currentMonth() {
    return new Date().getMonth() + 1; // 1-12
  }
  function todayLocal() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function nextMonth(m) {
    return m === 12 ? 1 : m + 1;
  }

  /* 旬データから当月の自動傾向を求める
   * 返り値: { trend: "cheap"|"soon-cheap"|"soon-up"|"high", label, icon }
   */
  function autoTrend(product, month) {
    const m = month || currentMonth();
    const peak = product.peak || [];
    if (peak.length === 0) return { trend: "high", label: "周年・相場次第", icon: "—" };
    const inNow = peak.includes(m);
    const inNext = peak.includes(nextMonth(m));
    if (inNow && inNext) return { trend: "cheap", label: "今が旬・お買い得", icon: "📉" };
    if (!inNow && inNext) return { trend: "soon-cheap", label: "これから安くなる", icon: "📉" };
    if (inNow && !inNext) return { trend: "soon-up", label: "そろそろ終わり・高くなる", icon: "📈" };
    return { trend: "high", label: "端境期・高め", icon: "📈" };
  }

  /* 手動上書きを反映した最終傾向 */
  function effectiveTrend(product, overrides, month) {
    const ov = overrides && overrides[product.id];
    if (ov === "cheap") return { trend: "cheap", label: "今おすすめ（社長判断）", icon: "📉", manual: true };
    if (ov === "high") return { trend: "high", label: "高め（社長判断）", icon: "📈", manual: true };
    return autoTrend(product, month);
  }

  /* おすすめリスト（安い順 / 高い順）を組み立て */
  function buildRecommendations(products, overrides, month) {
    const cheap = [];
    const up = [];
    products.forEach((p) => {
      const t = effectiveTrend(p, overrides, month);
      if (t.trend === "cheap" || t.trend === "soon-cheap") cheap.push({ p, t });
      else if (t.trend === "soon-up") up.push({ p, t });
    });
    return { cheap, up };
  }

  function yen(n) {
    const v = Math.round(Number(n) || 0);
    return "¥" + v.toLocaleString("ja-JP");
  }

  /* 注文明細から金額計算（確定単価ベース。未確定は0） */
  function calcTotals(items) {
    let subtotal = 0;
    items.forEach((it) => {
      const unit = Number(it.unitPrice) || 0;
      const qty = Number(it.qty) || 0;
      subtotal += unit * qty;
    });
    const tax = Math.floor(subtotal * TAX_RATE);
    return { subtotal, tax, total: subtotal + tax };
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function statusLabel(status) {
    return { received: "受付", priced: "単価確定", done: "発行済" }[status] || status;
  }

  window.YasaiCommon = {
    TAX_RATE,
    currentMonth,
    todayLocal,
    autoTrend,
    effectiveTrend,
    buildRecommendations,
    yen,
    calcTotals,
    escapeHtml,
    statusLabel,
  };
})();
