# 本番化セットアップ（社長用・やさしい手順）

このページの通りに進めると、
- ① **発注が来たらDiscordに通知**
- ② **注文が実際に管理画面へ届く＋複数の端末で共有**（本番化）

ができます。**鍵（キー）は社長ご本人が入力**してください（Grootは代理入力しません）。

所要：だいたい10〜15分。むずかしくありません。

---

## 全体像（3ステップ）
1. **Supabase**（注文の保管場所）を無料で作る → 鍵を2つコピー
2. **Discord**で通知の入口（ウェブフック）を作る → URLを1つコピー
3. コピーした**3つの値**を `config.js` に貼る（GitHubの画面で編集）

---

## ステップ1：Supabase（注文の保管場所）を作る

1. https://supabase.com を開き「Start your project」→ GitHubアカウントでログイン
2. 「New project」→ 名前は `yasai`、データベースパスワードは適当に決めて控える、リージョンは `Northeast Asia (Tokyo)` → Create
3. 数分待つ（コーヒー1杯）
4. 左メニュー **SQL Editor** → 「New query」→ プロジェクト内の `supabase_schema.sql` の中身を**全部コピペ**して **Run**（テーブルが作られます）
5. 左メニュー **Project Settings（歯車）→ API** を開く。次の2つを控える：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **anon public** キー（`eyJ...` で始まる長い文字。※「service_role」キーは絶対に使わない／貼らない）

> なぜanonキーでいいか：このキーは公開前提で、後述のルール（RLS）で守られているためです。

---

## ステップ2：Discordの通知入口（ウェブフック）を作る

1. 通知を受けたいDiscordサーバーの**チャンネル**を用意（例：`#発注通知`）
2. そのチャンネルの**歯車（編集）→ 連携サービス → ウェブフック → 新しいウェブフック**
3. 名前を「やさい発注」などにして、**「ウェブフックURLをコピー」** → URLを控える
   （`https://discord.com/api/webhooks/...` という長いURL）

---

## ステップ3：3つの値を `config.js` に貼る（GitHub画面で編集）

1. https://github.com/kimochiichiba-netizen/yasai-hacchu-board/blob/main/assets/config.js を開く
2. 右上の**鉛筆マーク（Edit）**をクリック
3. 下のように、`//` を外して3つの値を貼り付ける：

```js
window.YASAI_CONFIG = {
  SUPABASE_URL: "（ステップ1のProject URL）",
  SUPABASE_ANON_KEY: "（ステップ1のanon publicキー）",
  DISCORD_WEBHOOK_URL: "（ステップ2のウェブフックURL）"
};
```

4. 右上の **Commit changes** を押す（保存）
5. 1〜2分待つと公開サイトに反映 → 発注画面で注文すると、**管理画面に届き、Discordにも通知**が飛びます。

---

## できたか確認する方法
- スマホで発注画面から1件注文 → パソコンの管理画面に出れば成功（共有OK）
- 同時にDiscordの`#発注通知`にメッセージが来れば通知も成功

---

## ⚠️ 安全のメモ（だいじ）
- **service_role（秘密）キーは絶対に貼らない**。使うのは anon public だけ。
- `config.js` は公開サイトの一部なので、**Discordウェブフックも他人に見える可能性**があります。
  - もし変な投稿が来たら、Discordでそのウェブフックを削除して作り直せばすぐ止まります。
  - 完全に隠したい場合は、下の「安全強化版」に切り替えます（Grootが対応します）。
- 公開前に、`supabase_schema.sql` の中の「TEMP」ポリシー（管理画面の閲覧・更新を誰でも可にする暫定設定）を、本番では**管理者ログイン限定**に置き換えるのが理想です。まずは動作優先でOK、運用が回ってきたらGrootが安全化します。

---

## （上級・任意）Discordを「安全強化版」にする
ウェブフックURLを公開サイトに置かず、Supabase側（裏側）から送る方法もあります。
やりたくなったらGrootに「Discordを安全版にして」と言ってください。Edge Function を用意してご案内します。
