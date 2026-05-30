/* やさい発注ボード — 設定ファイル（雛形）
 *
 * 【デモ／社内検証】このままで OK。各端末内に注文が保存されます。
 *
 * 【本番（取引先↔社長で共有）】Supabase を使う場合だけ、下記のコメントを外して
 * ご自身の値を入れてください（鍵の登録は社長ご本人の操作です）。
 * あわせて index.html / admin.html の </body> 直前に、改ざん対策付きで
 * Supabase ライブラリを読み込んでください：
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js"
 *           integrity="sha384-<公式が配布するハッシュ>" crossorigin="anonymous"></script>
 *   （integrity 値は https://www.srihash.org/ で生成できます）
 */

// window.YASAI_CONFIG = {
//   SUPABASE_URL: "https://xxxxx.supabase.co",
//   SUPABASE_ANON_KEY: "eyJhbGciOi...（anon public キー。secret/service キーは絶対に置かない）",
//   ADMIN_PASSCODE: "好きな合言葉",  // ←管理画面 admin.html のロック。未設定ならロックなし（デモ）
//   DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/xxx/yyy"  // ←発注時にこのチャンネルへ通知
// };
//
// 【Discord通知の作り方】Discordの対象チャンネル → 設定(歯車) → 連携サービス →
//   ウェブフック → 新しいウェブフック → URLをコピー → 上の DISCORD_WEBHOOK_URL に貼る（社長ご本人の操作）。
//   ※公開サイトに直書きするとURLが見えてしまうため、本番では Supabase 経由の送信に切り替え推奨。
