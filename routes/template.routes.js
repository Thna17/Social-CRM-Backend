// template.routes.js
const express = require("express");
const router = express.Router();
const { Template, TemplateOption } = require("../models");
const authenticateToken = require("../middleware/authenticateToken"); // Adjust path if needed
router.use(authenticateToken);

// Get all templates for user
router.get('/', async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { user_id: req.user.id },
      include: TemplateOption
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const template = await Template.create({
        ...req.body,
        facebook_id: req.user.id 
      });
      // ... rest of 

    await Promise.all(
      req.body.options.map(opt => 
        TemplateOption.create({ ...opt, template_id: template.id })
      )
    );

    res.json(await Template.findByPk(template.id, { include: TemplateOption }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add similar PUT and DELETE endpoints
module.exports = router;