const express = require("express");
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselags.ca",
  "9sm5xk": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("hello!");
});
app.listen(PORT, () => {
  console.log(`Eample app listening on port ${PORT}`);
});