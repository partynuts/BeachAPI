const App = require('./src/app');

(async () => {
  const app = await App({connectionString: process.env.DATABASE_URL});
  const port = process.env.PORT || 4040;
  const models = require('./src/models');

  await models.sync({force: process.env.UPDATEDB});

  app.listen(port, () => console.log(`BeachApp listening on port ${port}`));
})();

process.on('SIGTERM', () => {
  global.client.end();
});

process.on('uncaughtException', handleException);

process.on('unhandledRejection', handleException);

function handleException(err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
}
