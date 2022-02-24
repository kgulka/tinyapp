const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "pmd"},
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
const { application, response } = require("express");
const express = require("express");

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//for db persist to file
const path = require('path');
const fs = require('fs');

//helper functions
const { generateRandomString, emailExists, writeToDB } = require("./helper");

const app = express();
const PORT = 8080;
const userCookieName = 'user_id';

//add the cookie parser
app.use(cookieParser());

//add the bodyParser
app.use(bodyParser.urlencoded({extended: true}));

//add the template engine ejs
app.set("view engine", "ejs");

//get the path for the url db
const urlDbFilePath = path.join(__dirname, 'db', 'urls_db.txt');
//Setup and read in the url database
let urlDatabase = {};
fs.readFile(urlDbFilePath, (err, fileContent) => {
  if (err) {
    //display the error
    console.log("readFile Error:", err);
  } else {
    console.log(JSON.parse(fileContent));
    urlDatabase = JSON.parse(fileContent);
  }
});

//*****ROUTES********
////////////GETS/////////////////
//GET: show the Database Object in JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//GET: Show List of URLs
app.get("/urls", (req, res) => {
  let templateVars = {};
  if (req.cookies[userCookieName]) {
    templateVars = { user_id: req.cookies[userCookieName], urls: urlDatabase };
  } else {
    templateVars = { user_id: undefined, urls: urlDatabase };
  }
  res.render("urls_index", templateVars);
});
//GET: Show new URL page
app.get("/urls/new", (req, res)=> {
  if (!req.cookies[userCookieName]) {
    res.redirect("/urls");
  } else {
    let templateVars = {};
    if (req.cookies[userCookieName]) {
      templateVars = { user_id: req.cookies[userCookieName], urls: urlDatabase };
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
  }
});
//GET: Show shortened url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: req.cookies[userCookieName],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});
//GET: shortened single url
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("URL Not Found");
    return;
  }
  const longURL  = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
//GET: register user
app.get("/register", (req, res) => {
  if (req.cookies[userCookieName]) {
    res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.cookies[userCookieName] };
    res.render("register", templateVars);
  }
});
//GET: login page
app.get("/login", (req, res) => {
  if (req.cookies[userCookieName]) {
    res.redirect("/urls");
  } else {
    let templateVars = null;
    if (req.cookies[userCookieName]) {
      templateVars = { user_id: req.cookies[userCookieName] };
    } else {
      templateVars = { user_id: undefined };
    }
    res.render("login",templateVars);
  }
});
////////////POSTS/////////////////
//POST: write a new user to the list
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('invalid email or password');
    res.statusCode = 400;
    return res.send('invalid email or password');
  }
  
  if (emailExists(users, email)) {
    console.log('email already exists!');
    res.statusCode = 400;
    return res.send('email already exists!');
  }
  users[newUserID] = { id: newUserID, email, password };
  res.cookie(userCookieName,users[newUserID]);
  console.log("userid cookie set");
  res.redirect("/urls");
});
//POST: write a new URL to the list
app.post("/urls", (req, res) => {
  if (!req.cookies[userCookieName]) {
    res.send("Unauthorized operation.");
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.cookies[userCookieName].id };
    //Writefile to save the database here.
    let err = null;
    writeToDB(urlDbFilePath, urlDatabase, err);
    if (err) {
      console.log("DB Write Error:", err);
    }
    //redirection to /urls/:shortURL
    res.redirect("/urls/" + newShortURL);
  }
});
//POST: delete a url
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies[userCookieName]) {
    res.send("Unauthorized operation.");
  } else {
    const selShortURL = req.params.shortURL;
    delete urlDatabase[selShortURL];
    //Writefile to save the database here.
    let err = null;
    writeToDB(urlDbFilePath, urlDatabase, err);
    if (err) {
      console.log("DB Write Error:", err);
    }
    //redirection to /urls (List)
    res.redirect("/urls");
  }
});
//POST: Update Long url
app.post("/urls/:shortURL", (req, res) => {

  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  let err = null;
  writeToDB(urlDbFilePath, urlDatabase, err);
  if (err) {
    console.log("DB Write Error:", err);
  }
  res.redirect("/urls");
  return;
});

//POST: login page
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('invalid email or password');
    res.statusCode = 403;
    return res.send('invalid email or password');
  }
  const user = emailExists(users, email);
  if (!user) {
    console.log('email does not exist!');
    res.statusCode = 403;
    return res.send('Error Logging In!');
  }
  if (users[user].password !== password) {
    console.log('password incorrect!');
    res.statusCode = 403;
    return res.send('Error Logging In!');
  }
  res.cookie(userCookieName,users[user]);
  res.redirect("/urls");
});
//POST: logout user_id
app.post("/logout", (req, res) => {
  res.clearCookie(userCookieName);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Eample app listening on port ${PORT}`);
});

/*
urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

{"b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
"IQl8eU": { longURL: "http://www.modindsoft.com", userID: "userRandomID" },
"UH3tPM": { longURL: "http://www.oldscollege.ca", userID: "userRandomID" },
"3Vi53G": { longURL: "http://www.pillar.ca", userID: "user2RandomID" },
"obhTDY": { longURL: "www.newone.com", userID: "user2RandomID" }
}
*/