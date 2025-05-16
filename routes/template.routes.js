// template.routes.js
const sequelize = require('../config/database');
const express = require("express");
const router = express.Router();
const {
  Template,
  TemplateOption,
  FacebookPage,
  FacebookAccount,
} = require("../models");
const authenticateToken = require("../middleware/authenticateToken"); // Adjust path if needed
router.use(authenticateToken);

// Get all templates for user
router.get("/", async (req, res) => {
  try {
    console.log(req.user.id, 200);

    const templates = await Template.findAll({
      where: { facebook_id: req.user.id },
      include: TemplateOption,
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new template
router.post("/", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const template = await Template.create({
      ...req.body,
      facebook_id: req.user.id,
      status: 'inactive' // New templates start as inactive
    }, { transaction });

    await Promise.all(
      req.body.options.map(opt =>
        TemplateOption.create({
          ...opt,
          template_id: template.id,
          product_data: opt.product_data || null,
        }, { transaction })
      )
    );

    await transaction.commit();
    const createdTemplate = await Template.findByPk(template.id, {
      include: TemplateOption
    });
    res.json(createdTemplate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// template.routes.js
router.put("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate ownership
    const template = await Template.findOne({
      where: { id: req.params.id, facebook_id: req.user.id },
      transaction
    });

    if (!template) {
      await transaction.rollback();
      return res.status(404).json({ error: "Template not found" });
    }

    // Update template
    await template.update({
      name: req.body.name,
      welcome_message: req.body.welcome_message,
      status: req.body.status
    }, { transaction });

    // Remove existing options
    await TemplateOption.destroy({
      where: { template_id: template.id },
      transaction
    });

    // Create new options
    await Promise.all(
      req.body.options.map(opt =>
        TemplateOption.create({
          ...opt,
          template_id: template.id,
          product_data: opt.product_data || null,
        }, { transaction })
      )
    );

    await transaction.commit();
    const updatedTemplate = await Template.findByPk(template.id, {
      include: TemplateOption
    });
    res.json(updatedTemplate);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ error: error.message });
  }
});

router.put('/pages/:pageId', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const page = await FacebookPage.findOne({
      where: { page_id: req.params.pageId },
      include: FacebookAccount,
      transaction
    });

    if (!page) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.FacebookAccount.id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Deactivate all templates for this account
    await Template.update(
      { status: 'inactive' },
      {
        where: { facebook_id: req.user.id },
        transaction
      }
    );

    // Activate the selected template
    await Template.update(
      { status: 'active' },
      {
        where: { id: req.body.active_template_id },
        transaction
      }
    );

    // Update page's active template
    await page.update({
      active_template_id: req.body.active_template_id
    }, { transaction });

    await transaction.commit();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Add get assigned template endpoint
router.get("/pages/:pageId", async (req, res) => {
  try {
    console.log("assign template", req.params.pageId);
    const page = await FacebookPage.findOne({
      where: { page_id: req.params.pageId },
      include: [Template],
    });

    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json(page.Template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add similar PUT and DELETE endpoints
module.exports = router;
