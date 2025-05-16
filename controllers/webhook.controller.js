// webhook.controller.js
const { FacebookPage, Template, TemplateOption, Message } = require("../models");
const axios = require("axios");

// Webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

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

      await Message.create({
        sender_id: senderId,
        page_id: pageId,
        message_type: messaging.message?.quick_reply ? 'quick_reply' : 'text',
        direction: 'incoming',
        option_selected: messaging.message?.quick_reply?.payload,
        timestamp: new Date(),
      });

      if (option) {
        // Send the selected option's reply
        if (option.product_data?.products) {
          // // Send product carousel
          await axios.post(`https://graph.facebook.com/v22.0/me/messages`, {
            recipient: { id: senderId },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: option.product_data.products.map(product => ({
                    title: product.title,
                    image_url: product.image_url,
                    subtitle: `${product.price}\n${product.subtitle}`,
                    ...(product.buttons?.length && { buttons: product.buttons })
                  }))
                }
              },
              quick_replies: page.Template.TemplateOptions.map(opt => ({
                content_type: "text",
                title: `${opt.option_number}️⃣ ${opt.option_text}`,
                payload: opt.option_number.toString()
              }))
            }
          }, {
            params: { access_token: page.page_access_token }
          });

          await Message.create({
            sender_id: senderId,
            page_id: pageId,
            message_type: 'product_carousel',
            direction: 'outgoing',
            products_count: option.product_data.products.length,
            timestamp: new Date()
          });


          // Send quick replies after carousel
          await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
            recipient: { id: senderId },
            message: {
              text: "What would you like to do next?",
              quick_replies: [
                { content_type: "text", title: "🏠 Main Menu", payload: "MAIN_MENU" },
                { content_type: "text", title: "🛒 View Cart", payload: "VIEW_CART" }
              ]
            }
          });

          await Message.create({
            sender_id: senderId,
            page_id: pageId,
            message_type: 'quick_reply',
            direction: 'outgoing',
            options_count: 2,
            timestamp: new Date()
          });
        } else {
          // Send normal text reply with quick replies
          await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
            recipient: { id: senderId },
            message: {
              text: option.reply_text,
              quick_replies: page.Template.TemplateOptions.map(opt => ({
                content_type: "text",
                title: `${opt.option_number}️⃣ ${opt.option_text}`,
                payload: opt.option_number.toString()
              }))
            }
          }, {
            params: { access_token: page.page_access_token }
          });

          await Message.create({
            sender_id: senderId,
            page_id: pageId,
            message_type: 'text',
            direction: 'outgoing',
            content: option.reply_text.substring(0, 255), // Store first 255 chars
            options_count: page.Template.TemplateOptions.length,
            timestamp: new Date()
          });
        }
      } else {
        const lastMessages = await Message.findAll({
          where: { sender_id: senderId, page_id: pageId },
          order: [['timestamp', 'DESC']],
          limit: 3
        });
        
        const hasRecentOption = lastMessages.length > 1 && lastMessages.some(m =>
          (m.option_selected && m.option_selected !== 0) ||
          m.message_type === 'product_carousel' ||
          m.message_type === 'text'
        );
        
        console.log(hasRecentOption);
        
        // Only send welcome message if no recent structured interactions
        if (!hasRecentOption) {
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
      
          await Message.create({
            sender_id: senderId,
            page_id: pageId,
            message_type: 'welcome_message',
            direction: 'outgoing',
            options_count: page.Template.TemplateOptions.length,
            timestamp: new Date()
          });
        }
      }

      return res.sendStatus(200);
    }

    res.sendStatus(400);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200);
  }
};