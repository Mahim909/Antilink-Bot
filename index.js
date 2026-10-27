const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)

  if(!sock.authState.creds.registered){
    const phoneNumber = "8801301492171"
    setTimeout(async () => {
      let code = await sock.requestPairingCode(phoneNumber)
      console.log("PAIR CODE FOR 8801301492171:", code)
    }, 3000)
  }

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if(!msg.message) return
    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const isLink = text.includes("http://") || text.includes("https://") || text.includes("www.") || text.includes("chat.whatsapp.com")
    if(isLink){
      if(text.toLowerCase().includes("shoponbd.netlify.app")) return
      await sock.sendMessage(msg.key.remoteJid, { delete: msg.key })
      console.log("Link Deleted:", text)
    }
  })
}
startBot()
