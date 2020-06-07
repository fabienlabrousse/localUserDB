const {validateToken} = require('./token-validator');
const {ACCESS_TOKEN_LIFE, ACCESS_TOKEN_SECRET} = require('./const');
const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const jwt = require('jsonwebtoken');
const {passwordHasher} = require('./password-hasher');



const HTTP_PORT = 8000;

var app = express();
app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});
app.use(express.json());

const sqlite = new sqlite3.Database('./user_database.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    }
});

app.patch("/init", (req, res) => {
    sqlite.run('CREATE TABLE users( \
            user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
            firstname NVARCHAR(20)  NOT NULL,\
            lastname NVARCHAR(20)  NOT NULL,\
            username NVARCHAR(20),\
            email NVARCHAR(40)\,\
            address NVARCHAR(200)\,\
            password NVARCHAR(64)\
        )', (err) => {
        if (err) {
            console.log("Table already exists.");
        }
        let insert = 'INSERT INTO users (lastname, firstname, username, email,address, password) VALUES (?,?,?,?,?,?)';
        sqlite.run(insert, ["Gordon", "Freeman", "admin", "test@test.com", "Address 1", passwordHasher("blackmesa")],
            (err) => {
                if (err) {
                    console.log("Error adding admin");
                }
                res.send();
            });

    });
});

app.get("/users/:id", (req, res) => {
    const id = req.params.id;
    sqlite.get("SELECT * FROM users where user_id = ?", id, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.status(200).json(row);
    });
});

app.get("/users", (req, res) => {
    sqlite.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.status(200).json({rows});
    });
});

app.post("/users/", (req, res) => {
    var reqBody = req.body;
    sqlite.run("INSERT INTO users (lastname, firstname, username, email, password) VALUES (?,?,?,?,?)",
        [reqBody.lastname, reqBody.firstname, reqBody.username, reqBody.email, passwordHasher(reqBody.password)],
        function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(201).json({
                "user_id": this.lastID
            })
        });
});

app.patch("/users/:id", (req, res) => {
    var reqBody = req.body;
    const id = req.params.id;
    sqlite.run(`UPDATE users SET lastname = ?, firstname = ?, username = ?, address = ?, password = ? WHERE user_id = ?`,
        [reqBody.lastname, reqBody.firstname, reqBody.username, reqBody.address, passwordHasher(reqBody.password), id],
        function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(200).json({updatedID: id});
        });
});

app.delete("/users/:id", (req, res) => {
    const deletedID = req.params.id;
    sqlite.run(`DELETE FROM users WHERE user_id = ?`,
        deletedID,
        function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(200).json({deletedID: deletedID})
        });
});

app.get("/login", (req, res) => {
    if (!req.body) {
        console.log("no body");
        res.status(401).send();
        return;
    }
    let username = req.body.username;
    let hashedPassword = passwordHasher(req.body.password);

    sqlite.get("SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1",
        [username, hashedPassword],
        (err, row) => {
            if (err || !row) {
                console.log("not found");
                res.status(401).send();
                return;
            }


            //use the payload to store information about the user such as username, user role, etc.
            let accessToken = jwt.sign({
                username: row.username
            }, ACCESS_TOKEN_SECRET, {
                expiresIn: ACCESS_TOKEN_LIFE
            });

            //send the access token to the client inside the header
            res.send({ token: accessToken });
        });

});

app.get("/secrets", validateToken, (req, res) => {
    res.send("rise and shine mr freeman");
});

