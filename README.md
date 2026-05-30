# やさい発注ボード 🥬

取引先からの手書き仕入れ表を、社長が文字起こしする手間をゼロにする発注システム。
**発注受付 → 単価確定 → 納品書・請求書PDF発行**まで一気通貫。旬カレンダーから「今が買い時／これから高くなる」野菜を自動でおすすめ表示します。

## できること

- **取引先**：あの仕入れ表そっくりの画面（`index.html`）で、品目・数量・サイズ／品種・希望金額を入力して送信。スマホ対応。
- **社長**：管理画面（`admin.html`）で注文を確認 → 確定単価を入力 → 納品書・請求書をPDF発行。旬・価格傾向の調整も可能。
- 消費税は食品の軽減税率 **8%** で自動計算。

## まずは触ってみる（鍵・登録なしで動きます）

1. `index.html` をダブルクリックでブラウザで開く → 数量を入れて「注文する」
2. `admin.html` を開く → 初回にパスコードを設定 → 届いた注文を開いて単価を入力 → PDFボタン

> この「デモモード」では注文はその端末のブラウザ内（localStorage）に保存されます。
> 取引先と社長で共有するには、下の「本番化」を行ってください。

## 納品書・請求書のPDF化

PDFボタンを押すとブラウザの印刷画面が開きます。**送信先で「PDFに保存」を選ぶ**とPDFになります（追加アプリ不要）。

## 本番化（取引先↔社長でリアルタイム共有）

データを端末間で共有するには **Supabase（無料枠）** を使います。鍵の登録は社長ご本人の操作です（代理入力はしません）。

1. https://supabase.com で無料プロジェクトを作成
2. `supabase_schema.sql` の中身を Supabase の SQL Editor で実行（テーブル作成）
3. プロジェクトの URL と **anon public キー** を取得（※ secret / service キーは絶対に置かない）
4. `assets/config.js` のコメントを外して URL とキーを記入
5. `index.html` と `admin.html` の `</body>` 直前に Supabase ライブラリを**改ざん対策付き**で追加：
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js"
           integrity="sha384-<srihash.orgで生成した値>" crossorigin="anonymous"></script>
   ```

## 公開（取引先にURLを渡す）

静的サイトなので無料ホスティングに置くだけ。社長ご本人の操作で：

- **Netlify**：フォルダをドラッグ＆ドロップ → URL発行。
- **GitHub Pages**：リポジトリに置いて Pages を有効化。

### ⚠ セキュリティ上の注意（重要）

- `admin.html` は注文情報が見える管理画面です。公開URLに置く場合は必ず **Netlify のパスワード保護**（または Basic 認証）をかけるか、**管理画面は社内PCのみ**で開いてください。アプリ内のパスコードは簡易ロックです。
- Supabase は **anon public キーのみ**使用。secret / service キーをフロントに置かないこと。
- 公開前に `supabase_schema.sql` の「TEMP」ポリシーを authenticated 限定に置き換えてください。

## ファイル構成

```
index.html         発注画面（取引先）
admin.html         管理画面（社長）
assets/
  data.js          商品マスタ＋旬データ（手書き表の全品目）
  common.js        旬判定・税計算など共通ロジック
  store.js         データ層（localStorage / Supabase 自動切替）
  order.js         発注画面ロジック
  admin.js         管理画面ロジック
  pdf.js           納品書・請求書のPDF生成
  styles.css       見た目
  config.js        Supabase設定（雛形）
supabase_schema.sql  本番用テーブル定義
docs/01_spec.md      仕様書
```

## 今回入れていないもの（後から追加可）

Freee会計連携・LINE通知・在庫管理（既存の kimochi-erp が担当領域）。
