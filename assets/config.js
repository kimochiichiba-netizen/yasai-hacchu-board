/* やさい発注ボード — 設定ファイル
 *
 * 本番（共有）モード有効。注文は Supabase に保存され、複数端末で共有されます。
 * ※ SUPABASE_ANON_KEY は「公開前提の anon キー」です（RLSで保護）。secret/service キーは絶対に置かない。
 */
window.YASAI_CONFIG = {
  SUPABASE_URL: "https://sutsqaigoypreqsxalea.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dHNxYWlnb3lwcmVxc3hhbGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjQ4ODAsImV4cCI6MjA5NTgwMDg4MH0.ojd20lTrzGcGMuKtltvGuHD4mt40J9kl01heXgmCHHk",

  // ▼ Discord通知を使うときだけ、社長がウェブフックURLを貼ってください（私は代理入力しません）
  //   Discordチャンネル → 設定 → 連携サービス → ウェブフック → URLをコピー → 下のコメントを外して貼る
  // DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/xxx/yyy",
};
