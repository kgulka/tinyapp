const generateRandomString = function () {
  const length =  6;
  const alphaNumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = '';
  for (let i = length; i > 0; --i) {
    result += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];
  }
  return result;
};

const { application, response } = require("express");
const express = require("express");

const bodyParser = require("body-parser");

//for db persist to file
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const dbFilePath = path.join(__dirname, 'db', 'urls_db.js');
let urlDatabase = null;
console.log("filepath:", dbFilePath);

urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};
/* ****TODO will have to troubleshoot this later.****
fs.readfile(dbFilePath, 'utf8', (err, fileContent) => {
  if (err) {
    //display the error 
    //response.statusCode = 500;
    //response.write(err.message);
  } else {
    //urlDatabase = fileContent;
    
    console.log("urlDatabase:", urlDatabase);
  }
});
*/

/*
{
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};
*/
app.get("/", (req, res) => {
  res.send("hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
//new url
app.get("/urls/new", (req, res)=> {
  res.render("urls_new");
});
app.get("/urls/404", (req, res)=> {
  res.render("urls_404");
});

//shortened urls
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
//shortened urls
app.get("/u/:shortURL", (req, res) => {
  const longURL  = urlDatabase[req.params.shortURL];
  //const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls/404/");
  }
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  /*//TODO add writefile to save the database here.
  fs.writefile(dbFilePath, urlDatabase, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
  });
  */ 
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  //redirection to /urls/:shortURL
  res.redirect("/urls/" + newShortURL);
});

/*
app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });
*/
app.listen(PORT, () => {
  console.log(`Eample app listening on port ${PORT}`);
});