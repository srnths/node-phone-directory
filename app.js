const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

const allowedExt = [
    '.js',
    '.ico',
    '.css'
];

const credentials = {
    user: "postgres",
    host: "localhost",
    database: "phone-directory",
    password: "root",
    port: 5432
};

const pool = new Pool(credentials);

app.post('/api/add-contact',express.json() ,async (req, res) => {
    const contact = req.body;
    const result = await pool.query(`insert into directory(
        "firstName", "lastName", "phone", "isMale", "address")
    values($1,$2,$3,$4,$5)`, 
    [   
        contact.firstName, 
        contact.lastName,
        contact.phone, 
        contact.isMale, 
        contact.address
    ]);
    if(result.rowCount){
        res.send();
    }
    else{
        res.send('Database error');
    }
});


app.get('/api/get-contacts', async (req, res) => {
    const result = await pool.query(`select * from directory`);
    res.send(result.rows);
});


app.put('/api/update-contact', express.json(), async (req, res) => {
    const contact = req.body;
    const result = await pool.query(`update directory set 
    "firstName"=($1), "lastName"=($2), "isMale"=($3), "address"=($4) where "phone"=($5)`, 
    [contact.firstName, contact.lastName, contact.isMale, contact.address, contact.phone]);
    await pool.query('commit');
    if(result.rows) {
        res.send();
    }
    else {
        res.send('Database error');
    }
});


app.delete('/api/delete-contact', express.json(), async (req, res) => {
    const phone = req.body.formData;
    const result = await pool.query(`delete from directory where phone=$1`, [phone]);
    if(result.rows) {
        res.send();
    }
    else {
        res.send('Database error');
    }
    
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