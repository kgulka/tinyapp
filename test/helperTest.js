const { assert } = require('chai');

const { emailExists } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('emailExists', function() {
  it('should return a user with valid email', function() {
    const user = emailExists(testUsers, "user@example.com");
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user,expectedUserID);
  });
  it('if user not found should return null', function() {
    const user = emailExists(testUsers, "user@example2.com");
    const expectedUserID = null;
    // Write your assert statement here
    assert.equal(user,expectedUserID);
  }); 
  it('if given email is null it should return null', function() {
    const user = emailExists(testUsers, null);
    const expectedUserID = null;
    // Write your assert statement here
    assert.equal(user,expectedUserID);
  });  
  it('if given users is null it should return null', function() {
    const user = emailExists(null, "user@example2.com");
    const expectedUserID = null;
    // Write your assert statement here
    assert.equal(user,expectedUserID);
  });  
  it('if given email is undefined it should return null', function() {
    const user = emailExists(testUsers, undefined);
    const expectedUserID = null;
    // Write your assert statement here
    assert.equal(user,expectedUserID);
  });  
});