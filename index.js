const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require('express')
const app = express()

app.get('/', (req,res) => res.send('Antilink Bot is Live! 24/7'))

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
console.log("ENV PORTS:", process.env.SERVER_PORT, process.env.PORT)
console.log("USING PORT:", PORT)

app.listen(PORT, '0.0.0.0', () => console.log("Server Live on", PORT))

// প্রথমে এটি ফাকা রাখুন, গ্রুপে মেসেজ দিলে লগে JID দেখতে পাবেন
const TARGET_GROUP_ID = "YOUR_GROUP_JID_HERE" 

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)

  // 📞 Call Reject & JID Finder Handler
  sock.ev.on('call', async (calls) => {
    for (let call of calls) {
      if (!call.isGroup) continue
      
      // লগে গ্রুপের JID প্রিন্ট করে দেখাবে
      console.log("========================================")
      console.log("🔥 GROUP CALL RECEIVED FROM JID:", call.from)
      console.log("========================================")

      // যদি TARGET_GROUP_ID সেট করা থাকে এবং মিলে যায়, তবেই কল কাটবে
      if (TARGET_GROUP_ID !== "YOUR_GROUP_JID_HERE" && call.from !== TARGET_GROUP_ID) continue
      
      await sock.rejectCall(call.id, call.from)
      
      const warningText = 
`⚠️ *সতর্কবার্তা: গ্রুপে কল দেওয়া নিষেধ!* ⚠️

প্রিয় সদস্য, এই গ্রুপে সরাসরি কল করা সম্পূর্ণ নিষিদ্ধ। আপনার জরুরি কোনো কথা বা প্রয়োজন থাকলে দয়া করে সরাসরি কোনো *অ্যাডমিন (Admin)*-কে ইনবক্স বা কল করুন। 

ধন্যবাদ! 🙏`;

      await sock.sendMessage(call.from, { text: warningText })
    }
  })

  // 🔗 Anti-Link & JID Finder Handler
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if (!msg.message) return
    
    const remoteJid = msg.key.remoteJid
    
    // শুধু গ্রুপ মেসেজের ক্ষেত্রে লগে JID প্রিন্ট করবে
    if (remoteJid.endsWith('@g.us')) {
      console.log("----------------------------------------")
      console.log("💬 GROUP MESSAGE FROM JID:", remoteJid)
      console.log("----------------------------------------")
    }

    if (TARGET_GROUP_ID !== "YOUR_GROUP_JID_HERE" && remoteJid !== TARGET_GROUP_ID) return

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const isLink = text.includes("http://") || text.includes("https://") || text.includes("www.") || text.includes("chat.whatsapp.com")
    
    if (isLink) {
      if (text.toLowerCase().includes("shoponbd.netlify.app")) return
      await sock.sendMessage(remoteJid, { delete: msg.key })
    }
  })
}
startBot()
