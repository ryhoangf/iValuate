const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const watchController = require('../controllers/watchController');

router.use(requireAuth);

router.get('/', (req, res) => watchController.list(req, res));
router.post('/', (req, res) => watchController.create(req, res));
router.delete('/:id', (req, res) => watchController.remove(req, res));
router.post('/:id/dismiss', (req, res) => watchController.dismiss(req, res));

module.exports = router;
