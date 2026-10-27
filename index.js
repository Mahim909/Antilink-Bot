const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if(!msg.message) return
    
    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    
    // লিংক আছে কিনা চেক
    const isLink = text.includes("http://") || text.includes("https://") || text.includes("chat.whatsapp.com") || text.includes("www.")

    if(isLink){
      // তোমার সাইটটা থাকলে Allow
      if(text.includes("shoponbd.netlify.app")){
        return // কিছুই করবে না
      } else {
        // বাকি সব লিংক চুপচাপ Delete
        await sock.sendMessage(msg.key.remoteJid, { delete: msg.key })
      }
    }
  })
}
startBot()
