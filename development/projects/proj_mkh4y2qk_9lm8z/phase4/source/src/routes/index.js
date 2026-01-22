/**
 * API Routes v1
 */

const express = require('express');
const router = express.Router();

// Example: Resource routes
router.get('/resources', (req, res) => {
  res.json({
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0
    }
  });
});

router.post('/resources', (req, res) => {
  res.status(201).json({
    message: 'Resource created',
    data: req.body
  });
});

router.get('/resources/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    // Resource details
  });
});

router.put('/resources/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    ...req.body,
    message: 'Resource updated'
  });
});

router.delete('/resources/:id', (req, res) => {
  res.status(204).send();
});

module.exports = router;
