const fs = require('fs');

const generateRandomString = function() {
  const length =  6;
  const alphaNumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = '';
  for (let i = length; i > 0; --i) {
    result += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];
  }
  return result;
};

const emailExists = function(usersIn, emailIn) {
  for (let user in usersIn) {
    if (usersIn[user].email === emailIn) {
      return user;
    }
  }
  return null;
};

const writeToDB = function(urlDbFilePath, urlDatabaseIn, errOut) {
  fs.writeFile(urlDbFilePath, JSON.stringify(urlDatabaseIn), function(err) {
    if (err) {
      console.log("writeToDB Err", err);
      errOut = err;
      return false;
    }
    console.log("wtb success");
    return true;
  });
};

const urlsForUser = function(urlDB, userID) {
  const urlsOut = {};
  for (let key in urlDB) {
    if (urlDB[key].userID === userID) {
      urlsOut[key] = urlDB[key];
    }
  }
  return urlsOut;
};
module.exports = { generateRandomString, emailExists, writeToDB, urlsForUser };