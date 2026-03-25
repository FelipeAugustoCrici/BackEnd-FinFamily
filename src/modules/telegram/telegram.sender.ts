interface InlineButton {
  text: string
  callback_data: string
}

function getBaseUrl() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  console.log('[TELEGRAM SENDER] Token presente:', !!token)
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN não configurado')
  return `https://api.telegram.org/bot${token}`
}

export async function sendMessage(chatId: string | number, text: string, buttons?: InlineButton[][]) {
  console.log('[TELEGRAM SENDER] sendMessage para chatId:', chatId)
  console.log('[TELEGRAM SENDER] Texto:', text)

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  }

  if (buttons) {
    body.reply_markup = { inline_keyboard: buttons }
  }

  try {
    const url = `${getBaseUrl()}/sendMessage`
    console.log('[TELEGRAM SENDER] Chamando:', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const responseText = await res.text()
    console.log('[TELEGRAM SENDER] Status:', res.status)
    console.log('[TELEGRAM SENDER] Resposta:', responseText)

    if (!res.ok) {
      throw new Error(`Telegram sendMessage failed [${res.status}]: ${responseText}`)
    }

    return JSON.parse(responseText)
  } catch (err) {
    console.error('[TELEGRAM SENDER] ❌ Erro ao enviar mensagem:', err)
    throw err
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await fetch(`${getBaseUrl()}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    })
  } catch (err) {
    console.error('[TELEGRAM SENDER] ❌ Erro ao responder callback:', err)
  }
}
