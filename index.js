const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require('express')
const app = express()

app.get('/', (req,res) => res.send('Antilink Bot is Live! 24/7'))

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
console.log("ENV PORTS:", process.env.SERVER_PORT, process.env.PORT)
console.log("USING PORT:", PORT)

app.listen(PORT, '0.0.0.0', () => console.log("Server Live on", PORT))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if(!msg.message) return
    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const isLink = text.includes("http://") || text.includes("https://") || text.includes("www.") || text.includes("chat.whatsapp.com")
    if(isLink){
      if(text.toLowerCase().includes("shoponbd.netlify.app")) return
      await sock.sendMessage(msg.key.remoteJid, { delete: msg.key })
    }
  })
}
startBot()
