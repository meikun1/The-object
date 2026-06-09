/**
 * THE OBJECT — приём заявок на бронь и пересылка их в Telegram.
 *
 * Это Cloudflare Worker (бесплатный). Он хранит токен бота СЕКРЕТНО,
 * чтобы тот не попадал в публичный код сайта. Сайт шлёт сюда заявку
 * (POST JSON), worker отправляет сообщение боту в ваш чат.
 *
 * Развёртывание — см. assets/БРОНЬ-TELEGRAM.md
 * Секреты (Settings → Variables): BOT_TOKEN, CHAT_ID
 * Опционально: ALLOWED_ORIGIN (домен сайта) для ограничения CORS.
 */
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    let d;
    try { d = await request.json(); } catch {
      return new Response('Bad Request', { status: 400, headers: cors });
    }

    // honeypot: если скрытое поле заполнено — это бот, тихо игнорируем
    if (d.company) return new Response(JSON.stringify({ ok: true }), { headers: cors });

    // минимальная валидация
    if (!d.name || !d.phone) {
      return new Response('Missing fields', { status: 422, headers: cors });
    }

    const lines = [
      '🍸 Новая бронь — THE OBJECT',
      `Имя: ${d.name}`,
      `Телефон: ${d.phone}`,
      `Дата: ${d.date || '-'}   Время: ${d.time || '-'}`,
      `Гостей: ${d.guests || '-'}`,
    ];
    if (d.note) lines.push(`Пожелания: ${d.note}`);

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: lines.join('\n'),
        disable_web_page_preview: true,
      }),
    });

    if (!tg.ok) {
      return new Response('Telegram error', { status: 502, headers: cors });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
