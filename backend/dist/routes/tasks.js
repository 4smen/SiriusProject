"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
//публичные роуты
router.get('/', taskController_1.getTasks);
router.post('/', taskController_1.createTask);
router.get('/stats', taskController_1.getStats);
//защищенные роуты (только для админа)
router.patch('/:id', auth_1.authenticateAdmin, auth_1.requireAdmin, taskController_1.updateTask);
exports.default = router;
