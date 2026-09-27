


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

// 登録情報を読み込み（1台分でも複数台の配列でも対応できるように処理）
let subscriptions = JSON.parse(pushSubscriptionJson);
if (!Array.isArray(subscriptions)) {
  subscriptions = [subscriptions];
}

webpush.setVapidDetails(
  'mailto:contact@haruharutv.jp',
  vapidPublicKey,
  vapidPrivateKey
);

// 日替わりのターゲット時刻判定
const dateStr = new Date().toISOString().split('T')[0];
const hash = crypto.createHash('sha256').update(dateStr + vapidPrivateKey).digest('hex');
const targetHour = parseInt(hash.substring(0, 8), 16) % 24;
const currentHour = new Date().getUTCHours();

console.log(`[${dateStr}] ターゲット時刻: ${targetHour}時 (UTC) / 現在: ${currentHour}時 (UTC)`);

if (isManual || currentHour === targetHour) {
  console.log(`--> ${subscriptions.length} 台の端末に通知を一斉送信します...`);
 const payload = JSON.stringify({
    title: "体操のお時間です！",
    body: "音楽でも流しながら始めよう",
    url: "https://youtu.be/al3CoAGcrTE?si=1-vE7lpdVhE1WRBd&t=57"
  });


  // 全端末へ並列送信
  const sendPromises = subscriptions.map((sub, index) => {
    return webpush.sendNotification(sub, payload)
      .then(res => console.log(`[端末 ${index + 1}] 送信成功 (${res.statusCode})`))
      .catch(err => console.error(`[端末 ${index + 1}] 送信失敗:`, err.message));
  });

  Promise.all(sendPromises).then(() => {
    console.log("すべての送信処理が完了しました。");
  });
} else {
  console.log("--> 本日の送信予定時刻ではないためスキップします。");
}