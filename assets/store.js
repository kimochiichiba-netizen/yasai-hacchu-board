/* やさい発注ボード — データストア層
 * Supabase が設定されていれば共有モード、無ければ localStorage モードで動作。
 * 画面側は store.* だけ呼べばよく、裏側の違いを意識しなくてよい。
 *
 * Supabase を使う場合: assets/config.js を作り、下記を定義する（社長ご本人が登録）。
 *   window.YASAI_CONFIG = { SUPABASE_URL: "https://xxx.supabase.co", SUPABASE_ANON_KEY: "ey..." };
 *   さらに <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> を読み込む。
 */
(function () {
  "use strict";

  const cfg = (typeof window !== "undefined" && window.YASAI_CONFIG) || {};
  const hasSupabase =
    !!cfg.SUPABASE_URL &&
    !!cfg.SUPABASE_ANON_KEY &&
    typeof window !== "undefined" &&
    typeof window.supabase !== "undefined";

  let sb = null;
  if (hasSupabase) {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  const LS_KEYS = {
    orders: "yasai_orders",
    overrides: "yasai_price_overrides",
    products: "yasai_products_override",
    partners: "yasai_partners",
  };

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("localStorage読み込み失敗:", e);
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("localStorage保存失敗:", e);
    }
  }

  function genId() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp =
      d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return stamp + rnd;
  }

  const store = {
    mode: hasSupabase ? "supabase" : "local",

    /* ---------- 注文 ---------- */
    async createOrder(order) {
      const record = {
        id: genId(),
        partner: order.partner || "",
        contact: order.contact || "",
        orderDate: order.orderDate || (window.YasaiCommon && window.YasaiCommon.todayLocal()),
        deliveryDate: order.deliveryDate || "",
        note: order.note || "",
        items: order.items || [],
        status: "received",
        createdAt: new Date().toISOString(),
      };
      if (sb) {
        const { error } = await sb.from("orders").insert(record);
        if (error) throw new Error("注文の保存に失敗しました: " + error.message);
      } else {
        const all = lsGet(LS_KEYS.orders, []);
        all.unshift(record);
        lsSet(LS_KEYS.orders, all);
      }
      return record;
    },

    async listOrders() {
      if (sb) {
        const { data, error } = await sb
          .from("orders")
          .select("*")
          .order("createdAt", { ascending: false });
        if (error) throw new Error("注文の取得に失敗しました: " + error.message);
        return data || [];
      }
      return lsGet(LS_KEYS.orders, []);
    },

    async getOrder(id) {
      const all = await store.listOrders();
      return all.find((o) => o.id === id) || null;
    },

    async updateOrder(id, patch) {
      if (sb) {
        const { error } = await sb.from("orders").update(patch).eq("id", id);
        if (error) throw new Error("注文の更新に失敗しました: " + error.message);
      } else {
        const all = lsGet(LS_KEYS.orders, []);
        const idx = all.findIndex((o) => o.id === id);
        if (idx >= 0) {
          all[idx] = Object.assign({}, all[idx], patch);
          lsSet(LS_KEYS.orders, all);
        }
      }
    },

    /* ---------- 価格傾向の手動上書き ---------- */
    async getOverrides() {
      if (sb) {
        const { data } = await sb.from("price_overrides").select("*");
        const map = {};
        (data || []).forEach((r) => (map[r.productId] = r.trend));
        return map;
      }
      return lsGet(LS_KEYS.overrides, {});
    },

    async setOverride(productId, trend) {
      if (sb) {
        if (trend === "auto") {
          await sb.from("price_overrides").delete().eq("productId", productId);
        } else {
          await sb.from("price_overrides").upsert({ productId, trend });
        }
      } else {
        const map = lsGet(LS_KEYS.overrides, {});
        if (trend === "auto") delete map[productId];
        else map[productId] = trend;
        lsSet(LS_KEYS.overrides, map);
      }
    },

    /* ---------- 商品マスタの単価上書き（社長が編集） ---------- */
    getProductOverrides() {
      return lsGet(LS_KEYS.products, {});
    },
    setProductOverride(productId, patch) {
      const map = lsGet(LS_KEYS.products, {});
      map[productId] = Object.assign({}, map[productId], patch);
      lsSet(LS_KEYS.products, map);
    },
  };

  window.YasaiStore = store;
})();
