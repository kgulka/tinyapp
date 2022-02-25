# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["screenshot description"](#)

!["screenshot description"](#)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## DB Files
Below are sample contents for the two db text files.

//Last User DB Sample - user_db.txt
{"aNhzQ5":{"id":"aNhzQ5","email":"newuser@example.com","password":"$2a$10$XUu6eHO1N3hBz/b34OAEeeOmg7ssDlmTRLICUrX1.mYhmNgtic16C"},"vn1JYv":{"id":"vn1JYv","email":"rob@bob.com","password":"$2a$10$6GLLDaVgxwRegnlYAFHJhODLsNIXzKMn./iTWx2wEBySYl.Lklyq2"}}

//Last URL DB sample - url_db.txt
{"PU0HsF":{"longURL":"http://www.example.com","userID":"aNhzQ5"},"tl1fQ9":{"longURL":"http://www.modindsoft.com","userID":"aNhzQ5"}}