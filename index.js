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

  // 📞 Call Reject Handler
  sock.ev.on('call', async (calls) => {
    for (let call of calls) {
      const chatId = call.chat || call.from
      if (chatId !== TARGET_GROUP_ID) continue
      
      try {
        await sock.rejectCall(call.id, chatId)
      } catch (err) {
        console.log("Call reject failed:", err)
      }
      
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
    if (msg.key.fromMe) return // বটের নিজের মেসেজ ইগ্নোর করবে
    
    const remoteJid = msg.key.remoteJid
    if (remoteJid !== TARGET_GROUP_ID) return

    // ফরওয়ার্ড করা মেসেজ ও সাধারণ মেসেজের টেক্সট বের করা
    let text = msg.message.conversation || 
               msg.message.extendedTextMessage?.text || 
               msg.message.imageMessage?.caption || 
               msg.message.videoMessage?.caption || 
               msg.message.documentMessage?.caption ||
               msg.message.templateButtonReplyMessage?.selectedId || ""

    // লিঙ্ক খোঁজার জন্য Regex (এটি ফরওয়ার্ড বা যেকোনো ফরম্যাটের লিঙ্ক ধরবে)
    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/gi
    const isLink = linkRegex.test(text)
    
    if (isLink) {
      // আপনার এলাউ করা লিঙ্ক ছাড়া বাকি সব ডিলিট করবে
      if (text.toLowerCase().includes("shoponbd.netlify.app")) return
      
      try {
        await sock.sendMessage(remoteJid, { delete: msg.key })
        console.log("🗑️ Link / Forwarded Link deleted successfully!")
      } catch (error) {
        console.log("Failed to delete link (Make sure Bot is Admin):", error)
      }
    }
  })
}
startBot()
