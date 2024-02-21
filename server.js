const express = require("express");
const app = express();
const PORT = process.env.PORT || 7000;
// const db = require("./database/Mysql"); //RealDb
const db = require('./database/MysqlLocal')
// const realDb = require('./database/MysqlLocal')
const cors = require("cors");
const moment = require("moment");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = "book_rook_tanachai";


app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    // "https://frontend-user-test-deploy-tanachais-projects.vercel.app/"
    "*",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Option, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  return next();
});


app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.get("", (req, res) => {
  res.send("Hello world");
});

app.post("/register_admin", async (req, res) => {
  const { username, pwd, tel } = req.body;
  const query = `INSERT INTO admin (username, password, tel) VALUES (?, ?, ?)`;
  //Hash the password
  const hashedPassword = await bcrypt.hash(pwd, 10);
  const queryCheckUsername = 'SELECT * FROM admin WHERE username = ?';

  db.query(queryCheckUsername, [username], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      res.status(500).json({ status: 'Username existed in database' })
      return;
    } else {
      db.query(query, [username, hashedPassword, tel], (err, result) => {
        if (err) {
          res.status(500).json({ err: "Internal Server Error" });
        } else {
          res.status(201).json({ status: "ok" });
        }
      });
    }
  })



});

app.post('/login_admin', async (req, res) => {
  const { username, password } = req.body
  const query = `SELECT * FROM admin WHERE username = ?`
  db.query(query, [username], async (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Internal server' })
    } else if (result.length > 0) {
      const admin = result[0];

      const passwordMatch = await bcrypt.compare(password, admin.password)

      if (passwordMatch) {

        const token = jwt.sign({ adminId: admin.id }, secretKey, { expiresIn: '1h' })
        res.status(200).json({ token, result })

      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }

    } else {
      res.status(401).json({ error: 'User not Found' })
    }
  })
})

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1];

  console.log(token)
  // if(!token){
  //   return res.status(403).json({ error: 'Token not provided' })
  // }

  // jwt.verify(token, secretKey, (err, decoded) => {
  //   if(err){
  //       return res.status(401).json({ error: 'invalid token' })
  //   }

  //   req.userId = decoded.userId
  //   next()
  // })

}

app.post('/verify_token', verifyToken, (req, res) => {
  res.json({ isValid: true });
});

app.get("/all_meeting_room", (req, res) => {
  const query = "SELECT * FROM meeting_room";
  db.query(query, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

app.get('/count_using_room', (req, res) => {
  const query = `SELECT room_name, COUNT(*) as room_count
  FROM book_room
  GROUP BY room_name;`

  db.query(query, (err, results) => {
    if (err) throw err;

    res.send(results)
  })
})

app.post("/book_room", (req, res) => {
  // const { id_meeting, room_name, event, date } = req.body
  const id_meeting = req.body.id_meeting;
  const meeting_Room =
    req.body.meeting_Room != undefined ? req.body.meeting_Room : "";
  const title = req.body.title != undefined ? req.body.title : "";
  const date = req.body.date != undefined ? req.body.date : "";
  const name = req.body.name != undefined ? req.body.name : "";
  const lastname = req.body.lastname != undefined ? req.body.lastname : "";
  const tel = req.body.tel != undefined ? req.body.tel : "";
  const department =
    req.body.department != undefined ? req.body.department : "";
  const startTime =
    req.body.dbStartTime != undefined ? req.body.dbStartTime : "";
  const endTime = req.body.dbEndTime != undefined ? req.body.dbEndTime : "";
  const query = `INSERT INTO book_room (id_meeting, room_name, event, date, name, lastname, tel, department, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const check_Overlapping = `SELECT *
    FROM book_room
    WHERE startTime >= ? AND endTime <= ?`;

  // console.log(id_meeting)
  const formatStartTime = moment(startTime).format("YYYY-MM-DD HH:mm:ss")
  const formatEndTime = moment(endTime).format("YYYY-MM-DD HH:mm:ss");
  // check_Overlapping
  db.query(check_Overlapping, [formatStartTime, formatEndTime], (err, result) => {
    console.log(result);
    if (result.length == 1) {
      res.json({ status: "Room was booked" });
      return;
    } else {
      db.query(
        query,
        [
          id_meeting,
          meeting_Room,
          title,
          date,
          name,
          lastname,
          tel,
          department,
          formatStartTime,
          formatEndTime,
        ],
        (err, result) => {
          if (err) {
            console.error(err);
          } else {
            res.send({ message: "Room Booked" });
          }
        }
      );
    }
  });
});

app.get("/mark_event", (req, res) => {
  const query = "SELECT * FROM book_room";
  db.query(query, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

app.post("/insert_meeting_room", (req, res) => {
  const { room_id, room_name } = req.body;
  const query_insert = `INSERT INTO meeting_room (room_id, room_name)
    VALUES (?, ?)`;

  db.query(query_insert, [room_id, room_name], (err, result) => {
    if (err) {
      console.error(err);
    } else {
      res.json({ status: true, result });
    }
  });
});

app.delete("/remove_event/:eventId", (req, res) => {
  const eventId = req.params.eventId;
  const delete_query = "DELETE FROM book_room WHERE id = ?";

  db.query(delete_query, [eventId], (err, result) => {
    if (err) {
      console.log(err);
    }

    res.json({ status: true });
  });
});
app.delete("/remove_room/:id", (req, res) => {
  const room_id = req.params.id;
  const delete_query = "DELETE FROM meeting_room WHERE id = ?";

  db.query(delete_query, [room_id], (err, result) => {
    if (err) throw err;

    res.json({ status: true });
  });
});

app.put("/update_meetingRoom", (req, res) => {
  const data =
    req.body != undefined ? req.body : { data: [], error: "No data" };
  const queryUpdate =
    "UPDATE meeting_room SET room_id = ? , room_name = ? WHERE id = ?";

  try {
    data.forEach((value) => {
      const id = value.id;
      const room_id = value.room_id;
      const room_name = value.room_name;

      db.query(queryUpdate, [room_id, room_name, id], (err, result) => {
        if (err) {
          console.error(err);
        }
      });
    });
    res.json({ status: "ok" });
  } catch (error) {
    console.log(error);
  }
});

app.put("/update_book_room", (req, res) => {
  const { id, room_name, event } = req.body;
  const query_update = `UPDATE book_room SET event = ? , room_name = ? WHERE id = ?`;

  db.query(query_update, [event, room_name, id], (err, result) => {
    if (err) {
      console.error(err);
    } else {
      res.json({ status: true });
    }
  });
});

app.put("/updateStartEnd", (req, res) => {
  const { event_id, start, end } = req.body;
  const query_update = `UPDATE book_room SET startTime = ? , endTime = ? WHERE id = ?`;

  //Change format timestamp to 24hours format
  const formatMomentStart = moment(start).format("YYYY-MM-DD HH:mm:ss");
  const formatMomentEnd = moment(end).format("YYYY-MM-DD HH:mm:ss");

  db.query(
    query_update,
    [formatMomentStart, formatMomentEnd, event_id],
    (err, result) => {
      if (err) {
        console.error(err);
      } else {
        res.json({ status: true });
      }
    }
  );
});

app.get("/using_meeting_room", (req, res) => {
  const query = `SELECT * FROM book_room ORDER BY id DESC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.json({ err });
    } else {
      res.send(result);
    }
  });
});

app.put('/updateBookRoomModal', (req, res) => {
  const { room_name, title, name, lastname, tel, department, event_id } = req.body

  const queryUpdate = `UPDATE book_room SET room_name = ? , event = ?, name = ?, lastname = ?, tel = ?, department = ? WHERE id = ?`
  db.query(queryUpdate, [room_name, title, name, lastname, tel, department, event_id], (err, result) => {
    if (err) {
      res.json({ ERROR: err })
    } else {
      res.status(200).json({ status: "OK" })
    }
  })
})


app.post("/")

app.listen(PORT, () => console.log("Server is running on " + PORT));
