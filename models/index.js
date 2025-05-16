const sequelize = require('../config/database');
const FacebookAccount = require('./facebookAccount.model');
const FacebookPage = require('./facebookPage.model');
const Template = require('./template.model')
const TemplateOption = require('./templateOption.model')
const Message = require('./message.model');

// Associations
FacebookPage.belongsTo(FacebookAccount, { foreignKey: 'facebook_id' });
FacebookAccount.hasMany(FacebookPage, { foreignKey: 'facebook_id' }); 
Template.hasMany(TemplateOption, { foreignKey: 'template_id' });
TemplateOption.belongsTo(Template, { foreignKey: 'template_id' });
FacebookPage.belongsTo(Template, { foreignKey: 'active_template_id' }); // Add this line
// Add to existing associations
Message.belongsTo(FacebookPage, {
  foreignKey: 'page_id',
  // targetKey: 'page_id', // This is the fix
});
FacebookPage.hasMany(Message, {
  foreignKey: 'page_id',
  // sourceKey: 'page_id', // Match the relationship properly
});

sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
});

module.exports = { FacebookPage, FacebookAccount, Template, TemplateOption, Message, sequelize };
