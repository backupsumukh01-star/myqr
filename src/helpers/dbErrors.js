'use strict';

function logDbConnectionError(logger, error) {
  if (error && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
    logger.error(
      'Cannot reach PostgreSQL. On Render, link a Postgres database and set DATABASE_URL. ' +
        'Locally, run Postgres on port 5432 (or set DATABASE_URL).'
    );
  }
  logger.error(error);
}

module.exports = { logDbConnectionError };
