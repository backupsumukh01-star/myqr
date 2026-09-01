'use strict';

function logDbConnectionError(logger, error) {
  if (error && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
    logger.error(
      'Cannot reach MySQL/MariaDB on the configured host/port. ' +
        'Nothing is listening on 3306. Start the database, then run npm run migrate again.\n' +
        'Windows (this project): npm run db:start\n' +
        'If MariaDB is installed: start the MariaDB service, or run mysqld.exe from Program Files\\MariaDB *\\bin'
    );
  }
  logger.error(error);
}

module.exports = { logDbConnectionError };
