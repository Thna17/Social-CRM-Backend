// webhook.controller.js
const { FacebookPage, Template, TemplateOption } = require("../models");
const axios = require("axios");

// Webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};


// exports.handleMessage = async (req, res) => {
//     try {
//       console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  
//       if (req.body.object === 'page') {
//         const entry = req.body.entry[0];
//         const messaging = entry.messaging[0];
  
//         // 👇 Skip delivery reports, read receipts, etc.
//         if (!messaging.message || !messaging.message.text) {
//           console.log('Skipping non-message payload (e.g. delivery receipt)');
//           return res.sendStatus(200);
//         }
  
//         const senderId = messaging.sender.id;
//         const pageId = entry.id;
//         const messageText = messaging.message?.quick_reply?.payload || 
//         messaging.message?.text?.trim();
  
//         const page = await FacebookPage.findOne({
//           where: { page_id: pageId },
//           include: {
//             model: Template,
//             include: TemplateOption
//           }
//         });
  
//         if (!page?.Template) return res.sendStatus(200);
  
//         let reply;
//         if (messageText === '1') {
//           reply = page.Template.TemplateOptions.find(o => o.option_number === 1)?.reply_text;
//         } else if (messageText === '2') {
//           reply = page.Template.TemplateOptions.find(o => o.option_number === 2)?.reply_text;
//         } else if (messageText === '3') {
//           reply = page.Template.TemplateOptions.find(o => o.option_number === 3)?.reply_text;
//         } else {
//           reply = page.Template.welcome_message;
//         }
  
//         await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
//             recipient: { id: senderId },
//             message: {
//               text: page.Template.welcome_message,
//               quick_replies: page.Template.TemplateOptions.map(opt => ({
//                 content_type: "text",
//                 title: `${opt.option_number}️⃣ ${opt.option_text}`,
//                 payload: opt.option_number.toString()
//               }))
//             }
//           }, {
//             params: { access_token: page.page_access_token }
//           });
          
//         return res.sendStatus(200);
//       }
  
//       // For Meta test payloads (just to log)
//       if (req.body.field === 'messages' && req.body.value?.message?.text) {
//         console.log('Received test message:', req.body.value.message.text);
//         return res.sendStatus(200);
//       }
  
//       res.sendStatus(400);
//     } catch (error) {
//       console.error('Webhook error:', error);
//       res.sendStatus(200);
//     }
//   };
  

exports.handleMessage = async (req, res) => {
    try {
      console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  
      if (req.body.object === 'page') {
        const entry = req.body.entry[0];
        const messaging = entry.messaging[0];
  
        // Handle quick reply payloads
        const messageText = messaging.message?.quick_reply?.payload || 
                           messaging.message?.text?.trim();
  
        if (!messageText) return res.sendStatus(200);
  
        const senderId = messaging.sender.id;
        const pageId = entry.id;
  
        const page = await FacebookPage.findOne({
          where: { page_id: pageId },
          include: {
            model: Template,
            include: TemplateOption
          }
        });
  
        if (!page?.Template) return res.sendStatus(200);
  
        // Find matching option
        const option = page.Template.TemplateOptions.find(
          o => o.option_number == messageText
        );
  
        if (option) {
          // Send the selected option's reply
          await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
            recipient: { id: senderId },
            message: { text: option.reply_text }
          }, {
            params: { access_token: page.page_access_token }
          });
        } else {
          // Show welcome message with buttons
          await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
            recipient: { id: senderId },
            message: {
              text: page.Template.welcome_message,
              quick_replies: page.Template.TemplateOptions.map(opt => ({
                content_type: "text",
                title: `${opt.option_number}️⃣ ${opt.option_text}`,
                payload: opt.option_number.toString()
              }))
            }
          }, {
            params: { access_token: page.page_access_token }
          });
        }
  
        return res.sendStatus(200);
      }
  
      res.sendStatus(400);
    } catch (error) {
      console.error('Webhook error:', error);
      res.sendStatus(200);
    }
  };