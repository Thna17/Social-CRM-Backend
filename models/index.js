const sequelize = require('../config/database');
const FacebookAccount = require('./facebookAccount.model');
const FacebookPage = require('./facebookPage.model');
const Template = require('./template.model')
const TemplateOption = require('./templateOption.model')

// Associations
FacebookPage.belongsTo(FacebookAccount, { foreignKey: 'facebook_id' });
FacebookAccount.hasMany(FacebookPage, { foreignKey: 'facebook_id' }); 
Template.hasMany(TemplateOption, { foreignKey: 'template_id' });
TemplateOption.belongsTo(Template, { foreignKey: 'template_id' });
FacebookPage.belongsTo(Template, { foreignKey: 'active_template_id' }); // Add this line
sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
});

module.exports = { FacebookPage, FacebookAccount, Template, TemplateOption };
