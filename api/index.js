const app = require("../src/app");

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Smart Home API running on port ${port}`);
  });
}
