const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require('express')
const app = express()

app.get('/', (req,res) => res.send('Antilink Bot is Live! 24/7'))

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log("Server Live on", PORT))

// ✅ আপনার গ্রুপের JID
const TARGET_GROUP_ID = "120363433640959519@g.us" 

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)

  // 📞 Advanced Call Reject Handler
  sock.ev.on('call', async (calls) => {
    for (let call of calls) {
      const chatId = call.chat || call.from
      if (chatId !== TARGET_GROUP_ID) continue
      
      console.log("📞 Group call detected from:", chatId, "Call ID:", call.id)

      try {
        // ১. Baileys বিল্ট-ইন রিজেক্ট মেথড
        await sock.rejectCall(call.id, chatId).catch(() => {})

        // ২. Node socket-এর মাধ্যমে রিজেক্ট প্যাকেট পাঠানোর চেষ্টা
        if (sock.ws && sock.ws.send) {
          await sock.ws.send(JSON.stringify({
            tag: 'call',
            attrs: { to: chatId, id: sock.generateMessageTag() },
            content: [{ tag: 'reject', attrs: { 'call-id': call.id, 'call-creator': call.from, count: '0' } }]
          })).catch(() => {})
        }
      } catch (err) {
        console.log("Call reject execution error:", err)
      }
      
      // ৩. সাথে সাথে গ্রুপে সতর্কবার্তা পাঠানো
      const warningText = 
`⚠️ *সতর্কবার্তা: গ্রুপে কল দেওয়া নিষেধ!* ⚠️

প্রিয় সদস্য, এই গ্রুপে সরাসরি কল করা সম্পূর্ণ নিষিদ্ধ। আপনার জরুরি কোনো কথা বা প্রয়োজন থাকলে দয়া করে সরাসরি কোনো *অ্যাডমিন (Admin)*-কে ইনবক্স বা কল করুন। 

ধন্যবাদ! 🙏`;

      await sock.sendMessage(chatId, { text: warningText })
    }
  })

  // 🔗 Strong Anti-Link Handler (Normal & Forwarded Links)
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if (!msg.message) return
    if (msg.key.fromMe) return 
    
    const remoteJid = msg.key.remoteJid
    if (remoteJid !== TARGET_GROUP_ID) return

    let text = msg.message.conversation || 
               msg.message.extendedTextMessage?.text || 
               msg.message.imageMessage?.caption || 
               msg.message.videoMessage?.caption || 
               msg.message.documentMessage?.caption ||
               msg.message.templateButtonReplyMessage?.selectedId || ""

    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/gi
    const isLink = linkRegex.test(text)
    
    if (isLink) {
      if (text.toLowerCase().includes("shoponbd.netlify.app")) return
      
      try {
        await sock.sendMessage(remoteJid, { delete: msg.key })
        console.log("🗑️ Link deleted successfully!")
      } catch (error) {
        console.log("Failed to delete link (Make sure Bot is Admin):", error)
      }
    }
  })
}
startBot()
