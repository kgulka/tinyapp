const generateRandomString = function() {
  const length =  6;
  const alphaNumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = '';
  for (let i = length; i > 0; --i) {
    result += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];
  }
  return result;
};
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
    console.log("readFile Error:", err);
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
  console.log("user_id:", req.cookies["user_id"]);
  if (req.cookies["user_id"]) {
    templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  } else {
    templateVars = { user_id: undefined, urls: urlDatabase };
  }
  res.render("urls_index", templateVars);
});
//Show new URL page
app.get("/urls/new", (req, res)=> {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    console.log("user_id:", req.cookies["user_id"]);
    templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  } else {
    templateVars = { user_id: undefined, urls: urlDatabase };
  }
  res.render("urls_new", templateVars);
});
//Show shortened url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
//shortened single url
app.get("/u/:shortURL", (req, res) => {
  const longURL  = urlDatabase[req.params.shortURL];

  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls");
  }
});
//register user 
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  res.render("register", templateVars);
});
//write a new user to the list
app.post("/register", (req, res) => {

  const newUserID = generateRandomString();
  const { email, password } = req.body;
  for (let user in users) {
    if (users[user].email === email) {
      console.log('email already exists!');
      return res.redirect("/urls");
    }
  }
  if (!email || !password) {
    console.log('invalid email or password');
    return res.redirect("/urls");
  }
  users[newUserID] = { id: newUserID, email, password };
  console.log("Users Obj:", users);
 // urlDatabase[newShortURL] = req.body.longURL;
  //Writefile to save the database here.
  /*
  fs.writeFile(dbFilePath, JSON.stringify(urlDatabase), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
  */
  res.cookie("user_id",users[newUserID]);
  console.log("userid cookie set");
  res.redirect("/urls");
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
  res.redirect("/urls");
});
// header login username
app.post("/login", (req, res) => {
  console.log("bodyUserN:",req.body.user_id);
  res.cookie("user_id",req.body.user_id); 
  console.log("cookie set");
  res.redirect("/urls");
});
// header logout user_id
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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