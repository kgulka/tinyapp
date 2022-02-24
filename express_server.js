const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"},
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
    console.log(JSON.parse(fileContent))
    urlDatabase = JSON.parse(fileContent);
  }
});  

//*****ROUTES********
//*******************
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
  let templateVars = {};
  if (req.cookies[userCookieName]) {
    templateVars = { user_id: req.cookies[userCookieName], urls: urlDatabase };
  } else {
    templateVars = { user_id: undefined, urls: urlDatabase };
  }
  res.render("urls_new", templateVars);
});
//GET: Show shortened url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: req.cookies[userCookieName],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
//GET: shortened single url
app.get("/u/:shortURL", (req, res) => {
  const longURL  = urlDatabase[req.params.shortURL];

  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls");
  }
});
//GET: register user
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies[userCookieName] };
  res.render("register", templateVars);
});

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
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  //Writefile to save the database here.
  if (!writeToDB(urlDbFilePath, urlDatabase, err)) {
    console.log(err);
    return;
  }
  //redirection to /urls/:shortURL
  res.redirect("/urls/" + newShortURL);
});
//POST: delete a url
app.post("/urls/:shortURL/delete", (req, res) => {
  const selShortURL = req.params.shortURL;
  delete urlDatabase[selShortURL];
  //Writefile to save the database here.
  if (!writeToDB(urlDbFilePath, urlDatabase, err)) {
    console.log(err);
    return;
  }
  //redirection to /urls (List)
  res.redirect("/urls");
});
//POST: Update Long url
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  if (!writeToDB(urlDbFilePath, urlDatabase, err)) {
    console.log(err);
    return;
  }
  res.redirect("/urls");
});
//GET: login page
app.get("/login", (req, res) => {
  let templateVars = null;
  if (req.cookies[userCookieName]) {
    templateVars = { user_id: req.cookies[userCookieName] };
  } else {
    templateVars = { user_id: undefined };
  }
  res.render("login",templateVars);
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
/*
urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};
*/
app.listen(PORT, () => {
  console.log(`Eample app listening on port ${PORT}`);
});