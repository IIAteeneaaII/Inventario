const express = require('express');
const router = express.Router();
const { getHabitsForDate, getAllHabits, generateDailyHabitLog, UpdateLog  } = require('../controllers/habitController');

router.get('/principalScr', getHabitsForDate);
router.get('/all', getAllHabits);
router.post('/actualizarLogs',UpdateLog)

module.exports = router;