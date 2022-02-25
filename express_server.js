const { application, response } = require("express");
const express = require("express");
const bcrypt = require("bcryptjs");

const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
 
//for db persist to file
const path = require('path');
const fs = require('fs');

//helper functions
const { generateRandomString, emailExists, writeToDB, urlsForUser } = require("./helper");

const app = express();
const PORT = 8080;
const userCookieName = 'user_id';

//Setup the encrypted cookie session.
app.use(cookieSession({
  name: 'session',
  keys: ['secret key1', 'secret key2'],
  maxAge: 72 * 60 * 60 * 1000
}));

//add the bodyParser
app.use(bodyParser.urlencoded({extended: true}));

//add the template engine ejs
app.set("view engine", "ejs");

//get the path for the url db
const urlDbFilePath = path.join(__dirname, 'db', 'urls_db.txt');
//get the path for the user db
const userDbFilePath = path.join(__dirname, 'db', 'user_db.txt');
//Setup and read in the url database
let urlDatabase = {};
fs.readFile(urlDbFilePath, (err, fileContent) => {
  if (err) {
    //display the error
    console.log("readFile Error:", err);
  } else {
    urlDatabase = JSON.parse(fileContent);
  }
});

//Setup and read in the user database
let users = {};
fs.readFile(userDbFilePath, (err, fileContent) => {
  if (err) {
    //display the error
    console.log("readFile Error:", err);
  } else {
    users = JSON.parse(fileContent);
  }
});

//*****ROUTES********
////////////GETS/////////////////
//GET: show the Database Object in JSON
app.get("/", (req, res) => {
  if (req.session[userCookieName]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
//GET: Show List of URLs
app.get("/urls", (req, res) => {
  let templateVars = {};
  if (req.session[userCookieName]) {
    templateVars = { user_id: req.session[userCookieName], urls: urlsForUser(urlDatabase, req.session[userCookieName].id) };
    res.render("urls_index", templateVars);
  } else {
    templateVars = { user_id: undefined, urls: undefined};
    res.render("urls_index", templateVars);
  }
  
});
//GET: Show new URL page
app.get("/urls/new", (req, res)=> {
  if (!req.session[userCookieName]) {
    res.redirect("/login");
  } else {
    let templateVars = {};
    if (req.session[userCookieName]) {
      templateVars = { user_id: req.session[userCookieName], urls: urlsForUser(urlDatabase,  req.session[userCookieName].id) };
     
      res.render("urls_new", templateVars);
    } else {
      res.redirect("/login");
    }
    
  }
});
//GET: Show shortened url
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {};
  
  if (req.session[userCookieName]) {
    const urls = urlsForUser(urlDatabase, req.session[userCookieName].id);
    if (urls) {
      if (urls[req.params.shortURL]) {
        templateVars = { user_id: req.session[userCookieName], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
        return res.render("urls_show", templateVars);
      } else {
        templateVars = { user_id: req.session[userCookieName], shortURL: undefined, longURL: undefined };
        return res.render("urls_show", templateVars);
      }
    }
  } else {
    const templateVars = { user_id: undefined, shortURL: undefined, longURL: undefined };
    return res.render("urls_show", templateVars);
  }
});
//GET: shortened single url
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.redirect("/msg?msg=URL Not Found");
    return;
  }
  const longURL  = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
//GET: register user
app.get("/register", (req, res) => {
  if (req.session[userCookieName]) {
    res.redirect("/urls");
  } else {
    const templateVars = { user_id: req.session[userCookieName] };
    res.render("register", templateVars);
  }
});
//GET: login page
app.get("/login", (req, res) => {
  if (req.session[userCookieName]) {
    res.redirect("/urls");
  } else {
    let templateVars = null;
    if (req.session[userCookieName]) {
      templateVars = { user_id: req.session[userCookieName] };
    } else {
      templateVars = { user_id: undefined };
    }
    res.render("login",templateVars);
  }
});
//GET: message page
app.get("/msg", (req, res) => {
  let templateVars = null;
  let msg = req.query.msg;

  if (!req.session[userCookieName]) {
    templateVars = { user_id: undefined, msg: msg };
  } else {
    if (req.session[userCookieName]) {
      templateVars = { user_id: req.session[userCookieName] , msg: msg};
    } else {
      templateVars = { user_id: undefined, msg: msg };
    }
  }
  res.render("msg_page",templateVars);
});
////////////POSTS/////////////////
//POST: write a new user to the list
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('invalid email or password');
    res.statusCode = 400;
    const msgStr = encodeURIComponent('invalid email or password');
    return res.redirect("/msg?msg=" + msgStr);
  }
  
  if (emailExists(users, email)) {
    console.log('email already exists!');
    res.statusCode = 400;
    const msgStr = encodeURIComponent('email already exists!');
    return res.redirect("/msg?msg=" + msgStr);
  }
  users[newUserID] = { id: newUserID, email, password: bcrypt.hashSync(password, 10) };
  req.session[userCookieName] = users[newUserID];
  let err = null;
  writeToDB(userDbFilePath, users, err);
  if (err) {
    console.log("DB Write Error:", err);
  }
  res.redirect("/urls");
});
//POST: write a new URL to the list
app.post("/urls", (req, res) => {
  if (!req.session[userCookieName]) {
    const msgStr = encodeURIComponent('Unauthorized operation.');
    return res.redirect("/msg?msg=" + msgStr);
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session[userCookieName].id };
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
  let urls = {};
  const selShortURL = req.params.shortURL;
  if (!req.session[userCookieName]) {
    const msgStr = encodeURIComponent('Unauthorized operation.');
    return res.redirect("/msg?msg=" + msgStr);
  }
  urls = urlsForUser(urlDatabase, req.session[userCookieName].id);
  if (!urls[selShortURL]) {
    const msgStr = encodeURIComponent('Unauthorized operation.');
    return res.redirect("/msg?msg=" + msgStr);
  }
  //ok to go ahead with the delete.
  delete urlDatabase[selShortURL];
  //Writefile to save the database here.
  let err = null;
  writeToDB(urlDbFilePath, urlDatabase, err);
  if (err) {
    console.log("DB Write Error:", err);
  }
  //redirection to /urls (List)
  return res.redirect("/urls");
  
});
//POST: Update Long url
app.post("/urls/:shortURL", (req, res) => {
  let urls = {};
  const selShortURL = req.params.shortURL;

  if (!req.session[userCookieName]) {
    const msgStr = encodeURIComponent('Unauthorized operation.');
    return res.redirect("/msg?msg=" + msgStr);
  }
  urls = urlsForUser(urlDatabase, req.session[userCookieName].id);
  if (!urls[selShortURL]) {
    const msgStr = encodeURIComponent('Unauthorized operation.');
    return res.redirect("/msg?msg=" + msgStr);
  }
  urlDatabase[selShortURL].longURL = req.body.longURL;
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
    const msgStr = encodeURIComponent('invalid email or password');
    return res.redirect("/msg?msg=" + msgStr);
  }
  const user = emailExists(users, email);
  if (!user) {
    console.log('email does not exist!');
    res.statusCode = 403;
    const msgStr = encodeURIComponent('Error Logging In!');
    return res.redirect("/msg?msg=" + msgStr);
  }
  if (!bcrypt.compareSync(password, users[user].password)) {
    console.log('password incorrect!');
    res.statusCode = 403;
    const msgStr = encodeURIComponent('Error Logging In!');
    return res.redirect("/msg?msg=" + msgStr);
  }
  req.session[userCookieName] = users[user];
  res.redirect("/urls");
});
//POST: logout user_id
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Eample app listening on port ${PORT}`);
});
