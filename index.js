const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require('express')
const app = express()

app.get('/', (req,res) => res.send('Antilink Bot is Live! 24/7'))

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
console.log("ENV PORTS:", process.env.SERVER_PORT, process.env.PORT)
console.log("USING PORT:", PORT)

app.listen(PORT, '0.0.0.0', () => console.log("Server Live on", PORT))

// 🎯 আপনার নির্দিষ্ট গ্রুপ আইডি (Group JID) নিচে বসান
const TARGET_GROUP_ID = "120363xxxxxxxxx@g.us" // <--- এখানে আপনার গ্রুপের JID বসাবেন

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)

  // 📞 Call Reject Handler
  sock.ev.on('call', async (calls) => {
    for (let call of calls) {
      // শুধুমাত্র আপনার নির্দিষ্ট গ্রুপে কল আসলেই রিজেক্ট করবে
      if (call.from !== TARGET_GROUP_ID) continue 
      
      // কল কেটে দেওয়া
      await sock.rejectCall(call.id, call.from)
      
      const warningText = 
`⚠️ *সতর্কবার্তা: গ্রুপে কল দেওয়া নিষেধ!* ⚠️

প্রিয় সদস্য, এই গ্রুপে সরাসরি কল করা সম্পূর্ণ নিষিদ্ধ। আপনার জরুরি কোনো কথা বা প্রয়োজন থাকলে দয়া করে সরাসরি কোনো *অ্যাডমিন (Admin)*-কে ইনবক্স বা কল করুন। 

ধন্যবাদ! 🙏`;

      await sock.sendMessage(call.from, { text: warningText })
    }
  })

  // 🔗 Anti-Link Handler
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if (!msg.message) return
    
    const remoteJid = msg.key.remoteJid
    
    // কনসোলে আপনার গ্রুপের JID পাওয়ার জন্য (প্রথমবার বের করতে কাজে লাগবে)
    console.log("Incoming Message Chat ID:", remoteJid)

    // শুধুমাত্র আপনার নির্দিষ্ট গ্রুপের মেসেজ প্রসেস করবে
    if (remoteJid !== TARGET_GROUP_ID) return

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const isLink = text.includes("http://") || text.includes("https://") || text.includes("www.") || text.includes("chat.whatsapp.com")
    
    if (isLink) {
      if (text.toLowerCase().includes("shoponbd.netlify.app")) return
      await sock.sendMessage(remoteJid, { delete: msg.key })
    }
  })
}
startBot()
