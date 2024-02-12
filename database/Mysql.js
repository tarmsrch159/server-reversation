const mysql = require("mysql")
var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "reversation_system"
})

db.connect(function(err){
    if(err){
        console.log(err)
    }else{
        console.log("Connected")

    }
})

module.exports = db
