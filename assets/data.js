/* やさい発注ボード — 商品マスタと旬データ
 * 手書き「野菜仕入れ表」＋市場お買上明細書（丸果大分大同青果ほか）＋
 * スーパー・市場の主力青果を網羅したマスタ。
 * peak: 旬（安く出回る）月の配列(1-12)。おすすめ判定に使う。[]は周年・相場次第。
 * units: 単位候補。variants: 品種・サイズ候補（任意）。std: 標準単価(円。社長が変更可)。
 */
const CATEGORIES = [
  { key: "leaf", label: "葉物・香味野菜" },
  { key: "fruitveg", label: "果菜・実野菜" },
  { key: "root", label: "根菜・いも類" },
  { key: "mushroom", label: "きのこ" },
  { key: "processed", label: "加工・その他" },
  { key: "citrus", label: "柑橘" },
  { key: "fruit", label: "果物" },
  { key: "season", label: "季節限定" },
];

const PRODUCTS = [
  // ===== 葉物・香味野菜 =====
  { id: "broccoli", name: "ブロッコリー", cat: "leaf", units: ["ケース", "個"], peak: [11, 12, 1, 2, 3], std: 200 },
  { id: "cauliflower", name: "カリフラワー", cat: "leaf", units: ["ケース", "個"], peak: [11, 12, 1, 2], std: 200 },
  { id: "cabbage", name: "キャベツ", cat: "leaf", units: ["個", "ケース"], peak: [3, 4, 5, 11, 12], std: 750 },
  { id: "hakusai", name: "白菜", cat: "leaf", units: ["個", "ケース"], peak: [11, 12, 1, 2], std: 850 },
  { id: "lettuce", name: "レタス", cat: "leaf", units: ["個", "ケース"], peak: [5, 6, 7, 11, 12], std: 850 },
  { id: "sunny", name: "サニーレタス", cat: "leaf", units: ["個", "ケース"], peak: [5, 6, 11, 12], std: 850 },
  { id: "saladna", name: "サラダ菜", cat: "leaf", units: ["袋", "ケース"], peak: [4, 5, 10, 11], std: 100 },
  { id: "horenso", name: "ほうれん草", cat: "leaf", units: ["束", "ケース"], peak: [11, 12, 1, 2], std: 130 },
  { id: "komatsuna", name: "小松菜", cat: "leaf", units: ["束", "ケース"], peak: [12, 1, 2], std: 55 },
  { id: "mizuna", name: "水菜", cat: "leaf", units: ["袋", "ケース"], peak: [11, 12, 1, 2], std: 90 },
  { id: "chingen", name: "チンゲン菜", cat: "leaf", units: ["袋", "ケース"], peak: [3, 4, 5, 9, 10], std: 90 },
  { id: "shungiku", name: "春菊", cat: "leaf", units: ["束", "ケース"], peak: [11, 12, 1, 2], std: 120 },
  { id: "nira", name: "ニラ", cat: "leaf", units: ["束", "ケース"], peak: [3, 4, 5], std: 2000 },
  { id: "shironegi", name: "白ネギ", cat: "leaf", units: ["束", "ケース"], peak: [11, 12, 1, 2], std: 1050 },
  { id: "konegi", name: "小ネギ", cat: "leaf", units: ["束", "パック"], peak: [3, 4, 5, 10, 11], std: 2200 },
  { id: "aonegi", name: "青ネギ", cat: "leaf", units: ["束", "パック"], peak: [3, 4, 5, 10, 11], std: 200 },
  { id: "ooba", name: "大葉", cat: "leaf", units: ["パック", "束"], peak: [6, 7, 8, 9], std: 350 },
  { id: "myoga", name: "みょうが", cat: "leaf", units: ["パック", "ケース"], peak: [6, 7, 8], std: 140 },
  { id: "mitsuba", name: "三つ葉", cat: "leaf", units: ["束", "パック"], peak: [3, 4, 5], std: 100 },
  { id: "pakuchi", name: "パクチー", cat: "leaf", units: ["束", "パック"], peak: [4, 5, 10, 11], std: 150 },
  { id: "parsley", name: "パセリ", cat: "leaf", units: ["パック", "束"], peak: [4, 5, 10, 11], std: 120 },
  { id: "toumyou", name: "豆苗", cat: "leaf", units: ["パック"], peak: [], std: 90 },
  { id: "kaiware", name: "かいわれ大根", cat: "leaf", units: ["パック"], peak: [], std: 80 },
  { id: "ninniku", name: "にんにく", cat: "leaf", units: ["袋", "ケース", "個"], peak: [6, 7], std: 200 },
  { id: "celery", name: "セロリ", cat: "leaf", units: ["株", "ケース"], peak: [11, 12, 1, 2], std: 500 },

  // ===== 果菜・実野菜 =====
  { id: "kyuri", name: "胡瓜（キュウリ）", cat: "fruitveg", units: ["本", "ケース", "箱"], peak: [6, 7, 8], std: 500 },
  { id: "tomato", name: "トマト", cat: "fruitveg", units: ["パック", "ケース", "箱"], peak: [6, 7, 8], std: 110 },
  { id: "minitomato", name: "ミニトマト", cat: "fruitveg", units: ["パック", "ケース"], peak: [6, 7, 8], std: 180 },
  { id: "nasu", name: "茄子（ナス）", cat: "fruitveg", units: ["袋", "ケース", "箱"], peak: [7, 8, 9], std: 900 },
  { id: "piman", name: "ピーマン", cat: "fruitveg", units: ["袋", "ケース"], peak: [6, 7, 8, 9], std: 100 },
  { id: "paprika", name: "パプリカ", cat: "fruitveg", units: ["個", "ケース"], peak: [6, 7, 8, 9], std: 200 },
  { id: "shishito", name: "ししとう", cat: "fruitveg", units: ["パック", "ケース"], peak: [7, 8, 9], std: 120 },
  { id: "aspara", name: "アスパラ", cat: "fruitveg", units: ["束", "ケース"], peak: [4, 5, 6], std: 200 },
  { id: "toumorokoshi", name: "とうもろこし", cat: "fruitveg", units: ["本", "ケース", "箱"], peak: [6, 7, 8], std: 1600 },
  { id: "okra", name: "オクラ", cat: "fruitveg", units: ["ネット", "パック", "ケース"], peak: [7, 8, 9], std: 40 },
  { id: "zucchini", name: "ズッキーニ", cat: "fruitveg", units: ["本", "ケース"], peak: [6, 7, 8], std: 150 },
  { id: "goya", name: "ゴーヤ", cat: "fruitveg", units: ["本", "ケース"], peak: [7, 8], std: 120 },
  { id: "kabocha", name: "かぼちゃ", cat: "fruitveg", units: ["個", "ケース"], peak: [7, 8, 9, 10], std: 200 },
  { id: "ingen", name: "いんげん", cat: "fruitveg", units: ["パック", "ケース"], peak: [6, 7, 8], std: 150 },
  { id: "edamame", name: "枝豆", cat: "fruitveg", units: ["袋", "ケース"], peak: [7, 8], std: 200 },
  { id: "soramame", name: "そら豆", cat: "fruitveg", units: ["袋", "ケース"], peak: [4, 5, 6], std: 250 },
  { id: "snap", name: "スナップえんどう", cat: "fruitveg", units: ["パック", "ケース"], peak: [4, 5, 6], std: 150 },
  { id: "greenpeas", name: "グリーンピース", cat: "fruitveg", units: ["袋", "パック"], peak: [4, 5], std: 200 },
  { id: "avocado", name: "アボカド", cat: "fruitveg", units: ["個", "ケース"], peak: [], std: 120 },

  // ===== 根菜・いも類 =====
  { id: "daikon", name: "大根", cat: "root", units: ["本", "ケース"], peak: [11, 12, 1, 2], std: 850 },
  { id: "kabu", name: "かぶ", cat: "root", units: ["袋", "束", "ケース"], peak: [11, 12, 3, 4], std: 120 },
  { id: "ninjin", name: "人参", cat: "root", units: ["袋", "ケース", "箱"], peak: [10, 11, 12, 4, 5], std: 300 },
  { id: "gobou", name: "ごぼう（洗い）", cat: "root", units: ["袋", "ケース"], peak: [11, 12, 1, 4], std: 100, note: "加工済あり" },
  { id: "renkon", name: "レンコン", cat: "root", units: ["パック", "ケース"], peak: [11, 12, 1], std: 200, note: "加工済あり" },
  { id: "jagaimo", name: "じゃがいも", cat: "root", units: ["袋", "ケース", "箱"], variants: ["メークイン", "男爵"], peak: [5, 6, 10, 11], std: 150 },
  { id: "satoimo", name: "里いも", cat: "root", units: ["袋", "ケース"], peak: [9, 10, 11, 12], std: 180 },
  { id: "nagaimo", name: "長芋", cat: "root", units: ["本", "ケース", "箱"], peak: [11, 12, 1, 2, 3], std: 4800 },
  { id: "kantarou", name: "甘太くん（さつまいも）", cat: "root", units: ["ケース", "袋"], variants: ["大", "中", "小"], peak: [10, 11, 12, 1], std: 250, note: "大分ブランド" },
  { id: "tamanegi", name: "玉葱", cat: "root", units: ["袋", "ケース", "箱"], peak: [5, 6, 9, 10], std: 1800 },
  { id: "shintamanegi", name: "新玉ねぎ", cat: "root", units: ["袋", "ケース"], peak: [3, 4, 5], std: 1500 },
  { id: "takenoko", name: "たけのこ", cat: "root", units: ["本", "ケース"], peak: [3, 4, 5], std: 300 },

  // ===== きのこ =====
  { id: "shimeji", name: "しめじ", cat: "mushroom", units: ["パック", "ケース"], peak: [9, 10, 11], std: 100 },
  { id: "enoki", name: "えのき茸", cat: "mushroom", units: ["ポリ", "パック", "ケース"], peak: [11, 12, 1], std: 55 },
  { id: "eringi", name: "エリンギ", cat: "mushroom", units: ["パック", "ケース"], peak: [9, 10, 11], std: 100 },
  { id: "shiitake", name: "椎茸", cat: "mushroom", units: ["パック", "バラ", "ケース"], peak: [3, 4, 5, 9, 10, 11], std: 200 },
  { id: "nameko", name: "なめこ", cat: "mushroom", units: ["パック", "バラ"], peak: [9, 10, 11], std: 100 },
  { id: "mush", name: "マッシュルーム", cat: "mushroom", units: ["パック", "バラ"], peak: [4, 5, 10, 11], std: 180 },
  { id: "maitake", name: "まいたけ", cat: "mushroom", units: ["パック", "ケース"], peak: [9, 10, 11], std: 150 },
  { id: "kikurage", name: "きくらげ", cat: "mushroom", units: ["パック", "袋"], peak: [], std: 200 },

  // ===== 加工・その他 =====
  { id: "shouga", name: "生姜", cat: "processed", units: ["パック", "ケース"], peak: [9, 10, 11], std: 150, note: "加工済あり" },
  { id: "mochi", name: "餅", cat: "processed", units: ["パック", "ケース"], peak: [12, 1], std: 300 },

  // ===== 柑橘 =====
  { id: "lemon", name: "レモン", cat: "citrus", units: ["個", "ケース"], peak: [10, 11, 12, 1], std: 670 },
  { id: "mikan", name: "みかん（温州）", cat: "citrus", units: ["袋", "ケース", "箱"], peak: [11, 12, 1], std: 300 },
  { id: "amanatsu", name: "甘夏みかん", cat: "citrus", units: ["個", "ケース", "箱"], peak: [4, 5, 6], std: 2150 },
  { id: "orange", name: "オレンジ", cat: "citrus", units: ["個", "ケース"], peak: [12, 1, 2, 3, 4, 5], std: 100, note: "輸入" },
  { id: "grapefruit", name: "グレープフルーツ", cat: "citrus", units: ["個", "ケース"], peak: [4, 5, 6], std: 150, note: "輸入" },
  { id: "hassaku", name: "はっさく", cat: "citrus", units: ["個", "ケース"], peak: [1, 2, 3], std: 150 },
  { id: "decopon", name: "デコポン", cat: "citrus", units: ["個", "ケース"], peak: [2, 3, 4], std: 300 },
  { id: "kabosu", name: "かぼす", cat: "citrus", units: ["袋", "ケース"], peak: [8, 9, 10], std: 150, note: "大分名産" },
  { id: "yuzu", name: "ゆず", cat: "citrus", units: ["個", "袋", "ケース"], peak: [11, 12], std: 200 },
  { id: "lime", name: "ライム", cat: "citrus", units: ["個", "ケース"], peak: [], std: 100, note: "輸入" },

  // ===== 果物 =====
  { id: "ringo", name: "りんご", cat: "fruit", units: ["袋", "ケース", "箱"], variants: ["ふじ", "その他"], peak: [10, 11, 12, 1], std: 400 },
  { id: "nashi", name: "梨", cat: "fruit", units: ["個", "ケース", "箱"], peak: [8, 9, 10], std: 250 },
  { id: "budou", name: "ぶどう", cat: "fruit", units: ["パック", "ケース", "箱"], variants: ["シャイン", "巨峰", "その他"], peak: [8, 9, 10], std: 500 },
  { id: "kaki", name: "柿", cat: "fruit", units: ["個", "ケース", "箱"], peak: [10, 11, 12], std: 200 },
  { id: "momo", name: "桃", cat: "fruit", units: ["個", "ケース", "箱"], peak: [7, 8, 9], std: 300 },
  { id: "sumomo", name: "すもも（プラム）", cat: "fruit", units: ["パック", "ケース"], peak: [6, 7, 8], std: 200 },
  { id: "biwa", name: "びわ", cat: "fruit", units: ["パック", "ケース"], peak: [5, 6], std: 300 },
  { id: "mango", name: "マンゴー", cat: "fruit", units: ["個", "ケース"], peak: [5, 6, 7, 8], std: 600 },
  { id: "suika", name: "スイカ", cat: "fruit", units: ["個", "玉"], peak: [6, 7, 8], std: 800 },
  { id: "melon", name: "メロン", cat: "fruit", units: ["個", "ケース"], variants: ["アンデス", "マスク", "その他"], peak: [5, 6, 7], std: 600 },
  { id: "banana", name: "バナナ", cat: "fruit", units: ["房", "ケース"], variants: ["フィリピン", "その他"], peak: [], std: 150, note: "輸入" },
  { id: "pineapple", name: "パインアップル", cat: "fruit", units: ["個", "ケース"], variants: ["フィリピン", "台湾"], peak: [4, 5, 6, 7], std: 3500, note: "輸入" },
  { id: "papaya", name: "パパイヤ", cat: "fruit", units: ["個", "ケース"], peak: [5, 6, 7, 8, 9], std: 300, note: "輸入" },
  { id: "kiwi", name: "キウイ", cat: "fruit", units: ["個", "パック", "ケース"], variants: ["ゴールド", "グリーン"], peak: [11, 12, 1, 2, 3], std: 5000 },
  { id: "dragonfruit", name: "ドラゴンフルーツ", cat: "fruit", units: ["個", "ケース"], peak: [7, 8, 9], std: 400, note: "輸入" },

  // ===== 季節限定 =====
  { id: "ichigo", name: "いちご", cat: "season", units: ["パック", "ケース"], variants: ["ゆめのか", "その他"], peak: [12, 1, 2, 3, 4], std: 150, note: "150円以下なら（1パック）" },
  { id: "sakuranbo", name: "さくらんぼ", cat: "season", units: ["ケース", "パック"], peak: [5, 6, 7], std: 100, note: "100円以下なら（3ケース）" },
];

if (typeof module !== "undefined") { module.exports = { CATEGORIES, PRODUCTS }; }
