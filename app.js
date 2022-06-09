const express = require('express');
const { Pool } = require('pg');
require("dotenv").config({path: './postgres.env'});
const path = require('path');
const app = express();

const allowedExt = [
    '.js',
    '.ico',
    '.css'
];

var credentials = {
    user: process.env.USER,
    host: process.env.HOST,
    password: process.env.PASSWORD,
    port: process.env.PORT
};

var pool = new Pool(credentials);

let check_db = async () => {
    const result = await pool.query(`SELECT datname FROM pg_catalog.pg_database WHERE 
        lower(datname) = lower('phone-directory')`);

    credentials.database = "phone-directory";

    if (result.rowCount == 0) {
        
        await pool.query(`CREATE DATABASE "phone-directory"`);

        pool = new Pool(credentials);

        await pool.query(`CREATE TABLE directory
        (
            "firstName" text NOT NULL,
            "lastName" text NOT NULL,
            phone integer NOT NULL,
            "isMale" boolean NOT NULL,
            address text NOT NULL,
            CONSTRAINT directory_pkey PRIMARY KEY (phone)
        )`);
    }
    else {
        pool = new Pool(credentials);
    } 
    
};

check_db();

app.post('/api/add-contact',express.json() ,async (req, res) => {
    const contact = req.body;
    await pool.query(`insert into directory(
        "firstName", "lastName", "phone", "isMale", "address")
    values($1,$2,$3,$4,$5)`, 
    [   
        contact.firstName, 
        contact.lastName,
        contact.phone, 
        contact.isMale, 
        contact.address
    ]);
    res.send();
});


app.get('/api/get-contacts', async (req, res) => {
    const result = await pool.query(`select * from directory`);
    res.send(result.rows);
});


app.put('/api/update-contact', express.json(), async (req, res) => {
    const contact = req.body;
    await pool.query(`update directory set 
    "firstName"=($1), "lastName"=($2), "isMale"=($3), "address"=($4) where "phone"=($5)`, 
    [contact.firstName, contact.lastName, contact.isMale, contact.address, contact.phone]);
    res.send();
});


app.delete('/api/delete-contact', express.json(), async (req, res) => {
    const phone = req.body.formData;
    await pool.query(`delete from directory where phone=$1`, [phone]);
    res.send();
    
});


app.get('*', (req, res) => {
    if(allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
        res.sendFile(path.resolve(__dirname + '/phone-directory/' + req.url));
    }
    else {
        res.sendFile(path.resolve(__dirname + '/phone-directory/index.html'));
    }
});


app.use(express.static(__dirname + '/phone-directory'));
app.use((err, req, res, next) => {
    // console.error(err.stack)
    res.sendFile(path.resolve(__dirname + '/phone-directory/index.html'))
});

const server = app.listen(3000);
console.log('listening at http://localhost:3000');

process.on('SIGTERM', async () => {
    server.close(() => {
        console.log('Process terminated');
    });
    await pool.end();
});

process.on('uncaughtException', (error) => {
    console.log(error);
});

// process.on('unhandledRejection', (error) => {
//     console.log(error);
// });