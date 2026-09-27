const webpush = require('web-push');
const crypto = require('crypto');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const pushSubscriptionJson = process.env.PUSH_SUBSCRIPTION;
const isManual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

if (!vapidPublicKey || !vapidPrivateKey || !pushSubscriptionJson) {
  console.error("エラー: Secretsに設定された環境変数が不足しています。");
  process.exit(1);
}

const subscription = JSON.parse(pushSubscriptionJson);

webpush.setVapidDetails(
  'mailto:admin@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

// --- 1日1回ランダム時間判定ロジック ---
// 今日の日付(YYYY-MM-DD) + 秘密鍵 のハッシュから、その日固有のランダムターゲット時間(0〜23)を判定
const dateStr = new Date().toISOString().split('T')[0];
const hash = crypto.createHash('sha256').update(dateStr + vapidPrivateKey).digest('hex');
const targetHour = parseInt(hash.substring(0, 8), 16) % 24; // 0〜23の整数
const currentHour = new Date().getUTCHours();

console.log(`[${dateStr}] 本日のターゲット時刻: ${targetHour}時 (UTC) / 現在時刻: ${currentHour}時 (UTC)`);

// 手動実行(workflow_dispatch) または ターゲット時刻に一致した時だけ送信
if (isManual || currentHour === targetHour) {
  console.log("--> 送信条件に一致しました。通知を送信します...");

  const payload = JSON.stringify({
    title: "体操のお時間です！,
    body: "音楽でも流しながら始めよう",
    url: "https://youtu.be/al3CoAGcrTE?si=1-vE7lpdVhE1WRBd&t=57"
  });

  webpush.sendNotification(subscription, payload)
    .then(res => console.log("送信成功 (ステータスコード):", res.statusCode))
    .catch(err => {
      console.error("送信失敗:", err);
      process.exit(1);
    });
} else {
  console.log("--> 本日の送信予定時刻ではないためスキップします。");
}
