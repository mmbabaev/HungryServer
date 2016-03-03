var express         = require('express');
var path            = require('path'); // модуль для парсинга пути
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

var parser = bodyParser.urlencoded({
    extended: true
});

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'styleru.net',
    user : 'hungry',
    database: "hungry",
    password: "C5tyVKTD"
});

connection.connect();

app.listen(1337, function() {
    console.log('Express server listening on port 1337');
});

app.put('/api/sendMail', parser,  function (req, res) {

    var mail = req.body.mail;

    var firstTime = true;
    connection.query("Select * from users where email='" + mail + "'", function(err, result) {
        if (result.length != 0) {
            firstTime = false;
        }
    });

    var nodemailer = require('nodemailer');

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'i.hungry.info@gmail.com',
            pass: 'asdfasdf11'
        }
    }, {
        // sender info
        from: 'iHungry support <mmbabaev@gmail.com>'
    });

    var code = Math.floor(Math.random() * 8999) + 1000;
    var message = {
        to: req.body.mail,
        subject: 'Регистрация в iHungry',
        text: 'Ваш код подтверждения: ' + code
    };

    transporter.sendMail(message, function(errorTransporter, info){
        error = {error: "Код подтверждения не был отправлен, попробуйте позже."};
        if (errorTransporter) {
            console.log("Error transporter");
            res.json(error);
            return;
        }
        console.log('Message sent: ' + info.response);
        if (firstTime) {
            request = "insert into users (code, email) values (?, ?)"
        }
        else {
            request = "update users set code=? where email=?"
        }
        connection.query(request,
            [code, mail],
            function(errorDB, result) {
                if (!errorDB) res.json({status: "OK", text: "Код был отправлен на адрес " + mail + "."});
                else res.json(error);
            })
    });
});

app.put('/api/activate', parser, function(req, res) {
    console.log(req.url);
    mail = req.body.mail;
    code = req.body.code;
    password = req.body.password;

    request = "update users set code=0, pass=? where email=? and code=?";
    connection.query(request, [password, mail, code], function(err, result) {
        if (err) {
            console.log("Database error: " + err);
            res.json({error: "Ошибка на сервере"});
        }
        else {
            if (result.rowsAffected == 0) {
                res.json({error: "Неправильная почта или код!"});
            }
            else {
                res.json({status: "success"});
            }
        }
    })
});

app.put('/api/registration', parser, function(req, res) {
    email = req.body.email;
    surname = req.body.surname;
    name = req.body.name;
    gender = req.body.gender;
    phone = req.body.phone;
    vk = req.body.vk;
    dorm_id = req.body.dorm_id;
    flat = req.body.flat;
    fac_id = req.body.fac_id;
    pass = req.body.pass;

    request = "update users set surname=?, name=?, gender=?," +
        "phone=?, vk=?, dorm_id=?, flat=?, fac_id=?, pass=? where email=?";
    params = [surname, name, gender, phone,
        vk, dorm_id, flat, fac_id, pass, email];

    connection.query(request, params, function(err, result) {
        if (err) {
            errorText = "Ошибка при регистрации нового пользователя"
            console.log(errorText + "\n" + err);
            res.json({error: errorText});
        }
        else {
            t = "Новый пользователь зарегестрирован";
            console.log(t);
            res.json({status: "success", text: t});
        }
    })
});