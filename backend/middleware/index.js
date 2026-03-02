const authMiddleware = require('./authMiddleware');
const roleMiddleware = require('./roleMiddleware');
const statusMiddleware = require('./statusMiddleware');

module.exports = {
  authMiddleware,
  roleMiddleware,
  statusMiddleware,
};
