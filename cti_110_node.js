
// This section loads modules.  It loads the Express server and stores
// it in "express", then creates a application, a router, and a path handler
const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');
const cors = require('cors');

// This part sets up the database
const {Pool} = require('pg');
// You may need to modify the password or database name in the following line:
const connectionString = `postgres://postgres:CTI_110_WakeTech@localhost/Gradebook`;
// The default password is CTI_110_WakeTech
// The default database name is Gradebook
const pool = new Pool({connectionString:connectionString})

// This line says when it's looking for a file linked locally,
// check in sub-folder "public"
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// This creates a new anonymous function that runs whenever 
// someone calls "get" on the server root "/"
router.get('/', function(req, res){
    // It just returns a file to their browser 
    // from the same directory it's in, called gradebook.html
    res.sendFile(path.join(__dirname, 'REYESVARGAS_gradebook.html'));
});

app.use("/", router);

router.get('/api/grades', function(req, res) {
    pool.query(
        `WITH RankedAssignments AS (
            SELECT 
                Students.student_id, 
                Students.first_name, 
                Students.last_name, 
                Assignments.grade,
                Assignments.due_date,
                ROW_NUMBER() OVER (
                    PARTITION BY Students.student_id 
                    ORDER BY Assignments.due_date DESC NULLS LAST
                ) as grade_rank
            FROM Students
            LEFT JOIN Assignments ON Assignments.student_id = Students.student_id
        )
        SELECT 
            student_id, 
            first_name, 
            last_name, 
            ROUND(AVG(grade), 2) as grade,
            MAX(CASE WHEN grade_rank = 1 THEN grade END) AS assignment_1,
            MAX(CASE WHEN grade_rank = 2 THEN grade END) AS assignment_2,
            MAX(CASE WHEN grade_rank = 3 THEN grade END) AS assignment_3
        FROM RankedAssignments
        GROUP BY student_id, first_name, last_name
        ORDER BY grade DESC`,
        [],
        function(err, result) {
            if (err) {
                console.error(err);
            }

            result.rows.forEach(function(row) {
                console.log(`Student Name: ${row.first_name} ${row.last_name}`);
                console.log(`Grade: ${row.grade}`);
                console.log(`Recent Assignments: 
                    Assignment 1: ${row.assignment_1}
                    Assignment 2: ${row.assignment_2}
                    Assignment 3: ${row.assignment_3}`);
            });

            res.status(200).json(result.rows);
        }
    );
});

let server = app.listen(3000, function(){
    console.log("App Server via Express is listening on port 3000");
    console.log("To quit, press CTRL + C");
});