const generateRandomString = function() {
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
const cookieParser = require('cookie-parser');


//for db persist to file
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
//add the cookie parser
app.use(cookieParser());
//add the bodyParser
app.use(bodyParser.urlencoded({extended: true}));
//add the template engine ejs
app.set("view engine", "ejs");

//Setup and read in the url database
let urlDatabase = null;

const dbFilePath = path.join(__dirname, 'db', 'urls_db.txt');
//Read the database file in.
fs.readFile(dbFilePath, (err, fileContent) => {
  if (err) {
    //display the error
    //response.statusCode = 500;
    //response.write(err.message);
  } else {
    urlDatabase = JSON.parse(fileContent);
    //console.log("urlDatabase:", urlDatabase);
  }
});

//*****ROUTES********
//*******************
//show the Database Object in JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//Show List of URLs
app.get("/urls", (req, res) => {
  let templateVars = {};
  if (req.cookies["username"]) {
    templateVars = { username: req.cookies["username"], urls: urlDatabase };
  } else {
    templateVars = { username: undefined, urls: urlDatabase };
  }
  res.render("urls_index", templateVars);
});
//Show new URL page
app.get("/urls/new", (req, res)=> {
  let templateVars = {};
  if (req.cookies["username"]) {
    templateVars = { username: req.cookies["username"], urls: urlDatabase };
  } else {
    templateVars = { username: undefined, urls: urlDatabase };
  }
  res.render("urls_new", templateVars);
});

//Show shortened url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { username: req.cookies["username"],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
//shortened single url
app.get("/u/:shortURL", (req, res) => {
  const longURL  = urlDatabase[req.params.shortURL];
  //const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls");
  }
});
//shortened single url
app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("register", templateVars);
});
//write a new URL to the list
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  //Writefile to save the database here.
  fs.writeFile(dbFilePath, JSON.stringify(urlDatabase), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
  //redirection to /urls/:shortURL
  res.redirect("/urls/" + newShortURL);
});
//delete a url
app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log("PARAMS:", req.params);  // Log the POST request body to the console
  const selShortURL = req.params.shortURL;
  delete urlDatabase[selShortURL];
  //Writefile to save the database here.
  fs.writeFile(dbFilePath, JSON.stringify(urlDatabase), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
  //redirection to /urls (List)
  res.redirect("/urls");
});
//Update Long url
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  fs.writeFile(dbFilePath, JSON.stringify(urlDatabase), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });

  //console.log("A-shorturl:",urlDatabase[req.params.shortURL]);
  res.redirect("/urls");
});
// header login username
app.post("/login", (req, res) => {
  console.log("bodyUserN:",req.body.username);
  res.cookie("username",req.body.username); //.send("cookie set");
  console.log("cookie set");
  res.redirect("/urls");
});
// header logout username
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

/*
urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};
app.get("/", (req, res) => {
  res.send("hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})
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