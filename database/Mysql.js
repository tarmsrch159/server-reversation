const mysql = require("mysql")
var db = mysql.createConnection({
    host: "bp2rcfdah8sxfinaos8r-mysql.services.clever-cloud.com",
    user: "u1oizaxi76k0n0vh",
    password: "NpHS1OxNGPtKNubkP4ye",
    database: "bp2rcfdah8sxfinaos8r"
})

db.connect(function(err){
    if(err){
        console.log(err)
    }else{
        console.log("Connected")

    }
})

module.exports = db
