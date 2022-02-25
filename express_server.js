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
    console.log(JSON.parse(fileContent));
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
    console.log(JSON.parse(fileContent));
    users = JSON.parse(fileContent);
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
    res.redirect("/urls");
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
    res.send("URL Not Found");
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
    res.send("Unauthorized operation.");
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
    return res.send("Unauthorized operation.");
  }
  urls = urlsForUser(urlDatabase, req.session[userCookieName].id);
  if (!urls[selShortURL]) {
    return res.send("Unauthorized operation.");
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
    return res.send("Unauthorized operation.");
  }
  urls = urlsForUser(urlDatabase, req.session[userCookieName].id);
  if (!urls[selShortURL]) {
    return res.send("Unauthorized operation.");
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
    return res.send('invalid email or password');
  }
  const user = emailExists(users, email);
  if (!user) {
    console.log('email does not exist!');
    res.statusCode = 403;
    return res.send('Error Logging In!');
  }
  if (!bcrypt.compareSync(password, users[user].password)) {
    console.log('password incorrect!');
    res.statusCode = 403;
    return res.send('Error Logging In!');
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


/*
///////////Below are URL and User DB file samples.///////////////
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

//Last URL DB sample
{"PU0HsF":{"longURL":"http://www.example.com","userID":"aNhzQ5"},"tl1fQ9":{"longURL":"http://www.modindsoft.com","userID":"aNhzQ5"}}

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
//Last User DB Sample
{"aNhzQ5":{"id":"aNhzQ5","email":"newuser@example.com","password":"$2a$10$XUu6eHO1N3hBz/b34OAEeeOmg7ssDlmTRLICUrX1.mYhmNgtic16C"},"vn1JYv":{"id":"vn1JYv","email":"rob@bob.com","password":"$2a$10$6GLLDaVgxwRegnlYAFHJhODLsNIXzKMn./iTWx2wEBySYl.Lklyq2"}}
*/