// stats.controller.js
const { FacebookPage, Template, Message, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getOverviewStats = async (req, res) => {
  try {
    // console.log(req.user.id);
    
    const { pageId, days = 7 } = req.query;
    const whereClause = { 
    //   page_id: pageId,
    // facebook_id: req.user.id,
      timestamp: { [Op.gte]: new Date(new Date() - days * 24 * 60 * 60 * 1000) }
    };

    // Base metrics
    const totalMessages = await Message.count({ where: whereClause });
    const incomingMessages = await Message.count({ 
      where: { ...whereClause, direction: 'incoming' } 
    });
    
    // Response rate calculation
    const responseRateQuery = await Message.findAll({
      attributes: [
        [sequelize.literal('COUNT(DISTINCT CASE WHEN direction = \'outgoing\' THEN sender_id END)'), 'responded_users'],
        [sequelize.literal('COUNT(DISTINCT sender_id)'), 'total_users']
      ],
      where: whereClause
    });

    // Popular options
    const popularOptions = await Message.findAll({
      attributes: [
        'option_selected',
        [sequelize.fn('COUNT', 'option_selected'), 'count']
      ],
      where: { ...whereClause, option_selected: { [Op.not]: null } },
      group: ['option_selected'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5
    });

    // Message type distribution
    const messageTypes = await Message.findAll({
      attributes: [
        'message_type',
        [sequelize.fn('COUNT', 'id'), 'count']
      ],
      where: whereClause,
      group: ['message_type']
    });

    // Response time analysis (in milliseconds)
    const responseTimes = await sequelize.query(`
        SELECT AVG(response_time) as avg_response_time
        FROM (
          SELECT 
            TIMESTAMPDIFF(SECOND, incoming.timestamp, outgoing.timestamp) * 1000 as response_time
          FROM messages AS incoming
          JOIN messages AS outgoing 
            ON incoming.sender_id = outgoing.sender_id
            AND outgoing.id = (
              SELECT MIN(id) 
              FROM messages 
              WHERE 
                sender_id = incoming.sender_id 
                AND direction = 'outgoing' 
                AND timestamp > incoming.timestamp
            )
          WHERE 
            incoming.direction = 'incoming' 
            AND outgoing.direction = 'outgoing'
            AND incoming.page_id = :pageId
            AND incoming.timestamp >= :startDate
        ) as response_data
      `, {
        replacements: { pageId, startDate: new Date(new Date() - days * 24 * 60 * 60 * 1000) },
        type: sequelize.QueryTypes.SELECT
      });
      
    // Peak hours analysis
    const peakHours = await Message.findAll({
        attributes: [
          [sequelize.literal("DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')"), 'hour'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'message_count']
        ],
        where: whereClause,
        group: [sequelize.literal("DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')")],
        order: [[sequelize.literal('message_count'), 'DESC']],
        limit: 5
      });
      
    // Product engagement
    // const productEngagement = await Message.findAll({
    //   attributes: [
    //     [sequelize.fn('SUM', sequelize.col('products_count')), 'total_products_sent'],
    //     [sequelize.literal(`COUNT(CASE WHEN message_type = 'product_carousel' THEN 1 END)`), 'carousels_sent'],
    //     [sequelize.literal(`COUNT(CASE WHEN option_selected = 'VIEW_CART' THEN 1 END)`), 'cart_views']
    //   ],
    //   where: whereClause
    // });

    res.json({
      total_messages: totalMessages,
      incoming_messages: incomingMessages,
      response_rate: {
        responded_users: responseRateQuery[0].dataValues.responded_users,
        total_users: responseRateQuery[0].dataValues.total_users,
        percentage: (responseRateQuery[0].dataValues.responded_users / responseRateQuery[0].dataValues.total_users * 100).toFixed(1)
      },
      popular_options: popularOptions.map(opt => ({
        option: opt.option_selected,
        count: opt.dataValues.count
      })),
      message_type_distribution: messageTypes.reduce((acc, type) => ({
        ...acc,
        [type.message_type]: type.dataValues.count
      }), {}),
      average_response_time: responseTimes[0].avg_response_time,
      peak_hours: peakHours.map(h => ({
        hour: h.dataValues.hour,
        count: h.dataValues.message_count
      })),
    //   product_engagement: {
    //     total_products_sent: productEngagement[0].dataValues.total_products_sent,
    //     carousels_sent: productEngagement[0].dataValues.carousels_sent,
    //     cart_view_rate: (productEngagement[0].dataValues.cart_views / productEngagement[0].dataValues.carousels_sent * 100).toFixed(1)
    //   }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};