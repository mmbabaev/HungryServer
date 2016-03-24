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
    host     : 'localhost',
    //port: 1337,
    user : 'root',
    database: "test",
    charset: "utf8"
});

connection.connect();

app.listen(1337, function() {
    console.log('Express server listening on port 1337');
});


app.put('/api/sendMail', parser,  function (req, res) {
    console.log("sendMail start");

    var mail = req.body.mail;

    connection.query("Select * from users where email='" + mail + "'", function(err, result) {

        if (result.length == 0) {
            request = "insert into users (code, email) values (?, ?)"
        }
        else {
            if (result[0]["code"] == "0") {
                error = { error: "Такой  e-mail уже зарегистрирован!" };
                console.log(error);
                res.json(error);
                return;
            }
            else {
                request = "update users set code=? where email=?"
            }
        }

        var nodemailer = require('nodemailer');

        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'i.hungry.info@gmail.com',
                pass: 'asdfasdf11'
            }
        }, {
            // sender info
            from: 'iHungry support <i.hungry.info@gmail.com>'
        });

        var code = Math.floor(Math.random() * 8999) + 1000;
        console.log("Code: " + code);

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

            connection.query(request,
                [code, mail],
                function(errorDB, result) {
                    console.log(result);
                    if (!errorDB) {
                        res.json({status: "OK", text: "Код был отправлен на адрес " + mail + "."});
                    }
                    else {
                        res.json(error);
                    }
                })
        });
    });
});

app.get('/api/checkCode', parser, function(req, res) {
    console.log(req.url);
    mail = req.query.mail;
    code = req.query.code;
    console.log(mail);
    console.log(code);

    request = "select * from users where email='" + mail + "' and code=" + code;
    console.log(request);
    connection.query(request, function(err, result) {
        if (err) {
            console.log("Database error: " + err);
            res.json({error: "Ошибка проверки кода"});
        }

        if (result.length == 0) {
            er = { error: "Неправильный код!" };
            console.log(er);
            console.log(result);
            res.json(er);
        }
        else {
            console.log(result);
            res.json({status: "success"});
        }
    });
});

app.put('/api/registration', parser, function(req, res) {
    email = req.body.mail;
    surname = req.body.surname;
    name = req.body.name;
    gender = req.body.gender;
    phone = req.body.phone;
    vk = req.body.vk;
    dorm_id = req.body.dorm_id;
    flat = req.body.flat;
    fac_id = req.body.fac_id;
    pass = req.body.pass;

    // todo: загружать фото и сохранять url

    request = "update users set surname=?, name=?, gender=?," +
        "phone=?, vk=?, dorm_id=?, flat=?, fac_id=?, pass=?, code=0 where email=? AND pass IS NULL";
    params = [surname, name, gender, phone,
        vk, dorm_id, flat, fac_id, pass, email];

    connection.query(request, params, function(err, result) {

        // todo: ошибка такой email уже существует
        if (err || result.affectedRows == 0) {
            errorText = "Ошибка при регистрации нового пользователя";
            console.log(result);
            console.log(request);
            console.log(errorText + "\n" + err);
            res.json({error: errorText});
        }
        else {
            var message = "Новый пользователь зарегестрирован";
            console.log(message);
            res.json({status: "success", text: message});
        }
    })


});

app.get('/api/login', parser, function(req, res) {
    mail = req.query.mail;
    password = req.query.password;

    connection.query("select * from users where email=? AND pass=?", [mail, password], function(err, result) {
        if (err) {
            error = { error: "Ошибка входа" };
            console.log(err);
            res.json(error)
        }
        else {
            if (result.length > 0) {
                console.log(mail + " login");

                res.json({ status: "success", id: result[0]["user_id"] });
            }
            else {
                // todo: различать когда неверный логин, а когда пароль ??
                error = { error: "Неверный логин или пароль!" };
                console.log(error);
                res.json(error);
            }
        }
    })
});