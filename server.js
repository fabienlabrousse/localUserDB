const {validateToken} = require('./token-validator');
const {ACCESS_TOKEN_LIFE, ACCESS_TOKEN_SECRET} = require('./const');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const express = require("express");
const shortid = require('shortid');
const jwt = require('jsonwebtoken');
const {passwordHasher} = require('./password-hasher');
const cors = require('cors');



const HTTP_PORT = 8000;

var app = express();
app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});
app.use(express.json());
app.use(cors());

const adapter = new FileSync('db.json');
const db = low(adapter);
db.read();

app.patch("/init", (req, res) => {

    const admins = {
        id: shortid.generate(),
        firstname:"Gordon",
        lastname: "Freeman",
        username: "admin",
        email: "test@test.com",
        address: "Address 1",
        password: passwordHasher("blackmesa")
    };
    db.set('users', [admins]).write();
    res.send();
});

app.get("/users/:id", (req, res) => {
    const requestid = req.params.id;
    const user = db.get('users').find({id : requestid}).value();
    if(user) {
        res.status(200).json(user);
        return;
    }
    res.status(404).send();
});

app.get("/users", (req, res) => {
    const users = db.get('users').value();
    if(users) {
        res.status(200).json(users);
        return;
    }
    res.status(404).send();
});

app.post("/users", (req, res) => {
    var user = req.body;
    user.password = passwordHasher(user.password);
    const generatedId = shortid.generate();
    user.id = generatedId;
    db.get('users').push(user).write();
    res.status(200).json({createdId: generatedId});
});

app.patch("/users/:id", (req, res) => {
    const requestId = req.params.id;
    const userFound = db.get('users').some(user => user.id === requestId).value();
    if(!userFound){
        res.status(404).send();
        return;
    }
    const user = req.body;
    user.id = requestId;
    user.password = passwordHasher(user.password);
    db.get('users').find({ id: requestId }).assign(user).write();
    res.status(200).send();
});

app.delete("/users/:id", (req, res) => {
    const requestId = req.params.id;
    const userFound = db.get('users').some(user => user.id === requestId).value();
    if(!userFound){
        res.status(404).send();
        return;
    }
    db.get('users').remove({ id: requestId }).write();
    res.status(200).json();
});

app.get("/login", (req, res) => {
    if (!req.body) {
        console.log("no body");
        res.status(401).send();
        return;
    }
    let username = req.body.username;
    let hashedPassword = passwordHasher(req.body.password);

    const userFound = db.get('users').some(user => user.username === username && user.password === hashedPassword).value();
    if(!userFound) {
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

app.get("/secrets", validateToken, (req, res) => {
    res.send("rise and shine mr freeman");
});

