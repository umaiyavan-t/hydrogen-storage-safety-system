/**
 * Telegram Alert Notification Service
 * Sends industrial safety notifications directly to a Telegram channel/chat.
 * Uses native Node.js fetch (zero external dependencies).
 */

const lastSentMap = new Map();
const COOLDOWN_MS = 15000; // 15-second debounce per asset to avoid alert flood during drills
let cachedChatId = process.env.TELEGRAM_CHAT_ID;

const resolveChatId = async (botToken) => {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  if (cachedChatId) return cachedChatId;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const chat = data.result[i]?.message?.chat || data.result[i]?.my_chat_member?.chat;
        if (chat && chat.id) {
          cachedChatId = String(chat.id);
          console.log(`[Telegram] Auto-detected chat ID: ${cachedChatId} (${chat.first_name || chat.title || 'User'})`);
          return cachedChatId;
        }
      }
    }
  } catch (err) {
    console.warn('[Telegram Auto-detect Error]', err.message);
  }
  return null;
};

const formatAlertMessage = (alert) => {
  const emoji = alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
  return [
    `${emoji} <b>HYDROGEN SAFETY ALERT: ${alert.severity || 'INCIDENT'}</b>`,
    `<b>Asset:</b> ${alert.vesselName || alert.vesselId || 'Plant Wide'} (<code>${alert.vesselId || 'ALL'}</code>)`,
    `<b>Zone:</b> ${alert.zone || 'Site Wide'}`,
    `<b>Parameter:</b> ${alert.metric || 'Safety Metric'}`,
    `<b>Trigger:</b> <code>${alert.triggerValue || 'Out of spec'}</code> (Limit: <code>${alert.thresholdValue || 'N/A'}</code>)`,
    `<b>Condition:</b> ${alert.message || 'Threshold crossed'}`,
    `<i>Recorded: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`
  ].join('\n');
};

const sendTelegramAlert = async (alert, options = {}) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && !chatId) {
    chatId = await resolveChatId(botToken);
  }

  // Debounce to prevent flooding chats during automated simulations
  const key = `${alert.vesselId || 'GEN'}:${alert.metric || 'ALERT'}`;
  const now = Date.now();
  if (!options.force && lastSentMap.has(key) && (now - lastSentMap.get(key) < COOLDOWN_MS)) {
    return { success: false, skipped: 'cooldown' };
  }
  lastSentMap.set(key, now);

  const text = options.customText || formatAlertMessage(alert);

  if (!botToken) {
    console.log(`[Telegram Mock] Alert dispatched:\n${text}`);
    return { success: true, mocked: true, message: 'Dispatched in mock mode (TELEGRAM_BOT_TOKEN not set).' };
  }

  if (!chatId) {
    console.log(`[Telegram] Bot active, awaiting subscriber: Send /start to @hydrosafe_alertbot on Telegram to link.`);
    return { success: false, waitingForChat: true, message: 'Bot active, awaiting subscriber. Send /start to your bot on Telegram.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn(`[Telegram API Error] ${data.description}`);
      return { success: false, error: data.description };
    }
    return { success: true, mocked: false, data };
  } catch (err) {
    console.warn(`[Telegram Network Error] ${err.message}`);
    return { success: false, error: err.message };
  }
};

const sendTelegramTest = async (overrides = {}) => {
  const testAlert = {
    alertId: `TEST-${Date.now().toString().slice(-4)}`,
    vesselId: overrides.vesselId || 'H2-TNK-01',
    vesselName: overrides.vesselName || 'High-Pressure Buffer Tank 01',
    zone: overrides.zone || 'Zone Alpha',
    severity: overrides.severity || 'CRITICAL',
    metric: overrides.metric || 'Overpressure Simulation Test',
    triggerValue: overrides.triggerValue || '695.0 bar',
    thresholdValue: overrides.thresholdValue || 'MAWP: 700 bar',
    message: overrides.message || 'Telegram alert test dispatch from Hydrogen Storage Safety Dashboard.'
  };
  return sendTelegramAlert(testAlert, { force: true });
};

module.exports = {
  formatAlertMessage,
  sendTelegramAlert,
  sendTelegramTest,
  COOLDOWN_MS
};
