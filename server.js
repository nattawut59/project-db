const http = require('http');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors')
const bodyParser = require('body-parser');
const hostname = '127.0.0.1';
const fs = require('fs');
const port = 3000;

const { readFileSync } = require("fs");
var path = require("path");
let cer_part = path.join(process.cwd(), 'isrgrootx1.pem');

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const connection = mysql.createConnection({
    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    user: '4DSzajUB6GhWbpY.root',
    password:"TG1cCLAUqdrPU6uk",
    database: 'hsms_db',
    port:4000,
    ssl:{
      ca:fs.readFileSync(cer_part)
    }
  });

app.use(cors());
app.use(express.json());
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });

// API หน้าแรก
app.get('/', (req, res) => {
    res.json({
        "Name": "Hospital Shift Management System",
        "Author": "Your Name",
        "APIs": [
            // APIs สำหรับผู้ใช้
            {"api_name": "/getUsers/", "method": "get"},
            {"api_name": "/getUserById/:id", "method": "get"},
            {"api_name": "/addUser/", "method": "post"},
            {"api_name": "/updateUser/", "method": "put"},
            {"api_name": "/deleteUser/:id", "method": "delete"},
            
            // APIs สำหรับแผนก
            {"api_name": "/getDepartments/", "method": "get"},
            {"api_name": "/getDepartmentById/:id", "method": "get"},
            {"api_name": "/addDepartment/", "method": "post"},
            {"api_name": "/updateDepartment/", "method": "put"},
            {"api_name": "/deleteDepartment/:id", "method": "delete"},
            
            // APIs สำหรับเวร
            {"api_name": "/getShifts/", "method": "get"},
            {"api_name": "/getShiftById/:id", "method": "get"},
            {"api_name": "/getShiftsByUserId/:id", "method": "get"},
            {"api_name": "/addShift/", "method": "post"},
            {"api_name": "/updateShift/", "method": "put"},
            {"api_name": "/deleteShift/:id", "method": "delete"},
            
            // APIs สำหรับ OT
            {"api_name": "/getOvertimes/", "method": "get"},
            {"api_name": "/getOvertimeById/:id", "method": "get"},
            {"api_name": "/getOvertimesByUserId/:id", "method": "get"},
            {"api_name": "/addOvertime/", "method": "post"},
            {"api_name": "/updateOvertime/", "method": "put"},
            {"api_name": "/deleteOvertime/:id", "method": "delete"},
            
            // APIs สำหรับคำขอเปลี่ยนเวร
            {"api_name": "/getRequests/", "method": "get"},
            {"api_name": "/getRequestById/:id", "method": "get"},
            {"api_name": "/getRequestsByUserId/:id", "method": "get"},
            {"api_name": "/addRequest/", "method": "post"},
            {"api_name": "/updateRequest/", "method": "put"},
            {"api_name": "/deleteRequest/:id", "method": "delete"},
            
            // APIs สำหรับการแสดงผลและรายงาน
            {"api_name": "/getStaffOT/", "method": "get"},
            {"api_name": "/getDepartmentOT/", "method": "get"},
            {"api_name": "/getMonthlyStats/", "method": "get"}
        ]
    });
});

// =============================================
// APIs สำหรับจัดการผู้ใช้ (Users)
// =============================================

// ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/getUsers/', (req, res) => {
    let sql = `
        SELECT u.*, d.dept_name 
        FROM Users u
        LEFT JOIN Department d ON u.dept_id = d.dept_id
    `;
    connection.query(sql, function(err, results, fields) {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: true, message: 'Error fetching users' });
        }
        res.json(results);
    });
});

// ดึงข้อมูลผู้ใช้ตาม ID
app.get('/getUserById/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT u.*, d.dept_name 
        FROM Users u
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE u.user_id = ?
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching user by ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching user' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }
        res.json(results[0]);
    });
});

// เพิ่มผู้ใช้ใหม่
app.post('/addUser', urlencodedParser, (req, res) => {
    let { name, email, password, role, dept_id } = req.body;
    let sql = 'INSERT INTO Users(name, email, password, role, dept_id) VALUES (?, ?, ?, ?, ?)';
    let values = [name, email, password, role, dept_id];
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error adding user:', err);
            return res.status(500).json({ error: true, message: 'Error adding user', details: err.message });
        }
        res.json({ error: false, data: results, message: 'User added successfully' });
    });
});

// อัพเดตข้อมูลผู้ใช้
app.put('/updateUser', urlencodedParser, (req, res) => {
    let { user_id, name, email, password, role, dept_id } = req.body;
    let sql = 'UPDATE Users SET name = ?, email = ?, role = ?, dept_id = ? WHERE user_id = ?';
    let values = [name, email, role, dept_id, user_id];
    
    // ถ้ามีการส่งรหัสผ่านมาด้วย
    if (password) {
        sql = 'UPDATE Users SET name = ?, email = ?, password = ?, role = ?, dept_id = ? WHERE user_id = ?';
        values = [name, email, password, role, dept_id, user_id];
    }
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: true, message: 'Error updating user', details: err.message });
        }
        res.json({ error: false, data: results, message: 'User updated successfully' });
    });
});

// ลบผู้ใช้
app.delete('/deleteUser/:id', (req, res) => {
    let id = req.params.id;
    let sql = 'DELETE FROM Users WHERE user_id = ?';
    
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: true, message: 'Error deleting user', details: err.message });
        }
        res.json({ error: false, data: results, message: 'User deleted successfully' });
    });
});

// =============================================
// APIs สำหรับจัดการแผนก (Department)
// =============================================

// ดึงข้อมูลแผนกทั้งหมด
app.get('/getDepartments/', (req, res) => {
    let sql = 'SELECT * FROM Department';
    connection.query(sql, function(err, results, fields) {
        if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ error: true, message: 'Error fetching departments' });
        }
        res.json(results);
    });
});

// ดึงข้อมูลแผนกตาม ID
app.get('/getDepartmentById/:id', (req, res) => {
    let id = req.params.id;
    let sql = 'SELECT * FROM Department WHERE dept_id = ?';
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching department by ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching department' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'Department not found' });
        }
        res.json(results[0]);
    });
});

// เพิ่มแผนกใหม่
app.post('/addDepartment', urlencodedParser, (req, res) => {
    let { dept_name } = req.body;
    let sql = 'INSERT INTO Department(dept_name) VALUES (?)';
    
    connection.query(sql, [dept_name], function(err, results, fields) {
        if (err) {
            console.error('Error adding department:', err);
            return res.status(500).json({ error: true, message: 'Error adding department', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Department added successfully' });
    });
});

// อัพเดตข้อมูลแผนก
app.put('/updateDepartment', urlencodedParser, (req, res) => {
    let { dept_id, dept_name } = req.body;
    let sql = 'UPDATE Department SET dept_name = ? WHERE dept_id = ?';
    
    connection.query(sql, [dept_name, dept_id], function(err, results, fields) {
        if (err) {
            console.error('Error updating department:', err);
            return res.status(500).json({ error: true, message: 'Error updating department', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Department updated successfully' });
    });
});

// ลบแผนก
app.delete('/deleteDepartment/:id', (req, res) => {
    let id = req.params.id;
    let sql = 'DELETE FROM Department WHERE dept_id = ?';
    
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error deleting department:', err);
            return res.status(500).json({ error: true, message: 'Error deleting department', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Department deleted successfully' });
    });
});

// =============================================
// APIs สำหรับจัดการเวร (Shifts)
// =============================================

// ดึงข้อมูลเวรทั้งหมดพร้อมชื่อผู้ใช้
app.get('/getShifts/', (req, res) => {
    let sql = `
        SELECT s.*, u.name, u.role, d.dept_name
        FROM Shifts s
        JOIN Users u ON s.user_id = u.user_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        ORDER BY s.shift_date DESC, s.start_time ASC
    `;
    connection.query(sql, function(err, results, fields) {
        if (err) {
            console.error('Error fetching shifts:', err);
            return res.status(500).json({ error: true, message: 'Error fetching shifts' });
        }
        res.json(results);
    });
});

// ดึงข้อมูลเวรตาม ID
app.get('/getShiftById/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT s.*, u.name, u.role, d.dept_name
        FROM Shifts s
        JOIN Users u ON s.user_id = u.user_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE s.shift_id = ?
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching shift by ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching shift' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'Shift not found' });
        }
        res.json(results[0]);
    });
});

// ดึงข้อมูลเวรตาม User ID
app.get('/getShiftsByUserId/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT s.*, u.name, u.role, d.dept_name
        FROM Shifts s
        JOIN Users u ON s.user_id = u.user_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE s.user_id = ?
        ORDER BY s.shift_date DESC, s.start_time ASC
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching shifts by user ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching shifts' });
        }
        res.json(results);
    });
});

// เพิ่มเวรใหม่
app.post('/addShift', urlencodedParser, (req, res) => {
    let { user_id, shift_date, start_time, end_time, is_overtime } = req.body;
    let sql = 'INSERT INTO Shifts(user_id, shift_date, start_time, end_time, is_overtime) VALUES (?, ?, ?, ?, ?)';
    let values = [user_id, shift_date, start_time, end_time, is_overtime || 0];
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error adding shift:', err);
            return res.status(500).json({ error: true, message: 'Error adding shift', details: err.message });
        }
        
        // ถ้ามีการทำ OT ให้บันทึกข้อมูล OT ด้วย
        if (is_overtime) {
            // คำนวณชั่วโมง OT (ตัวอย่างง่ายๆ)
            const startHour = parseInt(start_time.split(':')[0]);
            const endHour = parseInt(end_time.split(':')[0]);
            let hours = endHour - startHour;
            if (hours < 0) hours += 24; // กรณีข้ามวัน
            
            // อัตราค่าจ้าง OT (ตัวอย่าง)
            const rate = 300; // บาทต่อชั่วโมง
            const total_payment = hours * rate;
            
            const otSql = 'INSERT INTO Overtime(user_id, shift_id, hours, rate, total_payment) VALUES (?, ?, ?, ?, ?)';
            const otValues = [user_id, results.insertId, hours, rate, total_payment];
            
            connection.query(otSql, otValues, function(otErr, otResults, otFields) {
                if (otErr) {
                    console.error('Error adding overtime:', otErr);
                    // ไม่ต้อง return error เพราะเวรถูกบันทึกไปแล้ว
                }
            });
        }
        
        res.json({ error: false, data: results, message: 'Shift added successfully' });
    });
});

// อัพเดตข้อมูลเวร
app.put('/updateShift', urlencodedParser, (req, res) => {
    let { shift_id, user_id, shift_date, start_time, end_time, is_overtime } = req.body;
    let sql = 'UPDATE Shifts SET user_id = ?, shift_date = ?, start_time = ?, end_time = ?, is_overtime = ? WHERE shift_id = ?';
    let values = [user_id, shift_date, start_time, end_time, is_overtime || 0, shift_id];
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error updating shift:', err);
            return res.status(500).json({ error: true, message: 'Error updating shift', details: err.message });
        }
        
        // ถ้ามีการทำ OT ให้อัพเดตหรือเพิ่มข้อมูล OT
        if (is_overtime) {
            // คำนวณชั่วโมง OT
            const startHour = parseInt(start_time.split(':')[0]);
            const endHour = parseInt(end_time.split(':')[0]);
            let hours = endHour - startHour;
            if (hours < 0) hours += 24; // กรณีข้ามวัน
            
            // อัตราค่าจ้าง OT
            const rate = 300; // บาทต่อชั่วโมง
            const total_payment = hours * rate;
            
            // ตรวจสอบว่ามี OT อยู่แล้วหรือไม่
            const checkOtSql = 'SELECT * FROM Overtime WHERE shift_id = ?';
            connection.query(checkOtSql, [shift_id], function(checkErr, checkResults) {
                if (checkErr) {
                    console.error('Error checking overtime:', checkErr);
                    return;
                }
                
                if (checkResults.length > 0) {
                    // อัพเดต OT ที่มีอยู่
                    const updateOtSql = 'UPDATE Overtime SET hours = ?, rate = ?, total_payment = ? WHERE shift_id = ?';
                    const updateOtValues = [hours, rate, total_payment, shift_id];
                    
                    connection.query(updateOtSql, updateOtValues, function(updateOtErr) {
                        if (updateOtErr) {
                            console.error('Error updating overtime:', updateOtErr);
                        }
                    });
                } else {
                    // เพิ่ม OT ใหม่
                    const insertOtSql = 'INSERT INTO Overtime(user_id, shift_id, hours, rate, total_payment) VALUES (?, ?, ?, ?, ?)';
                    const insertOtValues = [user_id, shift_id, hours, rate, total_payment];
                    
                    connection.query(insertOtSql, insertOtValues, function(insertOtErr) {
                        if (insertOtErr) {
                            console.error('Error inserting overtime:', insertOtErr);
                        }
                    });
                }
            });
        } else {
            // ถ้าไม่มี OT ให้ลบข้อมูล OT (ถ้ามี)
            const deleteOtSql = 'DELETE FROM Overtime WHERE shift_id = ?';
            connection.query(deleteOtSql, [shift_id], function(deleteOtErr) {
                if (deleteOtErr) {
                    console.error('Error deleting overtime:', deleteOtErr);
                }
            });
        }
        
        res.json({ error: false, data: results, message: 'Shift updated successfully' });
    });
});

// ลบเวร
app.delete('/deleteShift/:id', (req, res) => {
    let id = req.params.id;
    
    // ลบ OT ที่เกี่ยวข้องก่อน (ถ้ามี)
    const deleteOtSql = 'DELETE FROM Overtime WHERE shift_id = ?';
    connection.query(deleteOtSql, [id], function(deleteOtErr) {
        if (deleteOtErr) {
            console.error('Error deleting related overtime:', deleteOtErr);
            // ไม่ return error เพราะยังต้องลบเวร
        }
        
        // ลบคำขอเปลี่ยนเวรที่เกี่ยวข้อง (ถ้ามี)
        const deleteReqSql = 'DELETE FROM Requests WHERE shift_id = ?';
        connection.query(deleteReqSql, [id], function(deleteReqErr) {
            if (deleteReqErr) {
                console.error('Error deleting related requests:', deleteReqErr);
                // ไม่ return error เพราะยังต้องลบเวร
            }
            
            // ลบเวร
            const deleteShiftSql = 'DELETE FROM Shifts WHERE shift_id = ?';
            connection.query(deleteShiftSql, [id], function(err, results, fields) {
                if (err) {
                    console.error('Error deleting shift:', err);
                    return res.status(500).json({ error: true, message: 'Error deleting shift', details: err.message });
                }
                res.json({ error: false, data: results, message: 'Shift deleted successfully' });
            });
        });
    });
});

// =============================================
// APIs สำหรับจัดการ OT (Overtime)
// =============================================

// ดึงข้อมูล OT ทั้งหมด
app.get('/getOvertimes/', (req, res) => {
    let sql = `
        SELECT o.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        ORDER BY s.shift_date DESC
    `;
    connection.query(sql, function(err, results, fields) {
        if (err) {
            console.error('Error fetching overtimes:', err);
            return res.status(500).json({ error: true, message: 'Error fetching overtimes' });
        }
        res.json(results);
    });
});

// ดึงข้อมูล OT ตาม ID
app.get('/getOvertimeById/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT o.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE o.ot_id = ?
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching overtime by ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching overtime' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'Overtime not found' });
        }
        res.json(results[0]);
    });
});

// ดึงข้อมูล OT ตาม User ID
app.get('/getOvertimesByUserId/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT o.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE o.user_id = ?
        ORDER BY s.shift_date DESC
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching overtimes by user ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching overtimes' });
        }
        res.json(results);
    });
});

// =============================================
// APIs สำหรับจัดการคำขอเปลี่ยนเวร (Requests)
// =============================================

// ดึงข้อมูลคำขอเปลี่ยนเวรทั้งหมด
app.get('/getRequests/', (req, res) => {
    let sql = `
        SELECT r.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Requests r
        JOIN Users u ON r.user_id = u.user_id
        JOIN Shifts s ON r.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        ORDER BY r.createdAt DESC
    `;
    connection.query(sql, function(err, results, fields) {
        if (err) {
            console.error('Error fetching requests:', err);
            return res.status(500).json({ error: true, message: 'Error fetching requests' });
        }
        res.json(results);
    });
});

// ดึงข้อมูลคำขอเปลี่ยนเวรตาม ID
app.get('/getRequestById/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT r.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Requests r
        JOIN Users u ON r.user_id = u.user_id
        JOIN Shifts s ON r.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE r.request_id = ?
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching request by ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching request' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'Request not found' });
        }
        res.json(results[0]);
    });
});

// ดึงข้อมูลคำขอเปลี่ยนเวรตาม User ID
app.get('/getRequestsByUserId/:id', (req, res) => {
    let id = req.params.id;
    let sql = `
        SELECT r.*, u.name, u.role, s.shift_date, s.start_time, s.end_time, d.dept_name
        FROM Requests r
        JOIN Users u ON r.user_id = u.user_id
        JOIN Shifts s ON r.shift_id = s.shift_id
        LEFT JOIN Department d ON u.dept_id = d.dept_id
        WHERE r.user_id = ?
        ORDER BY r.createdAt DESC
    `;
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error fetching requests by user ID:', err);
            return res.status(500).json({ error: true, message: 'Error fetching requests' });
        }
        res.json(results);
    });
});

// เพิ่มคำขอเปลี่ยนเวรใหม่
app.post('/addRequest', urlencodedParser, (req, res) => {
    let { user_id, shift_id, reason } = req.body;
    let sql = 'INSERT INTO Requests(user_id, shift_id, reason) VALUES (?, ?, ?)';
    let values = [user_id, shift_id, reason || ''];
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error adding request:', err);
            return res.status(500).json({ error: true, message: 'Error adding request', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Request added successfully' });
    });
});

// อัพเดตสถานะคำขอเปลี่ยนเวร
app.put('/updateRequest', urlencodedParser, (req, res) => {
    let { request_id, status, reason } = req.body;
    let sql = 'UPDATE Requests SET status = ?, reason = ? WHERE request_id = ?';
    let values = [status, reason || '', request_id];
    
    connection.query(sql, values, function(err, results, fields) {
        if (err) {
            console.error('Error updating request:', err);
            return res.status(500).json({ error: true, message: 'Error updating request', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Request updated successfully' });
    });
});

// ลบคำขอเปลี่ยนเวร
app.delete('/deleteRequest/:id', (req, res) => {
    let id = req.params.id;
    let sql = 'DELETE FROM Requests WHERE request_id = ?';
    
    connection.query(sql, [id], function(err, results, fields) {
        if (err) {
            console.error('Error deleting request:', err);
            return res.status(500).json({ error: true, message: 'Error deleting request', details: err.message });
        }
        res.json({ error: false, data: results, message: 'Request deleted successfully' });
    });
});

// =============================================
// APIs สำหรับการแสดงผลและรายงาน
// =============================================

// ดึงข้อมูล OT ของบุคลากรแต่ละคน (สำหรับแสดงกราฟแท่ง)
app.get('/getStaffOT/', (req, res) => {
    // ข้อมูลเริ่มต้นและสิ้นสุดของเดือนที่เลือก (อาจรับเป็น query parameter)
    let month = req.query.month || 'มีนาคม 2025';
    let startDate, endDate;
    
    // แปลงชื่อเดือนไทยเป็นวันที่
    switch (month) {
        case 'มกราคม 2025':
            startDate = '2025-01-01';
            endDate = '2025-01-31';
            break;
        case 'กุมภาพันธ์ 2025':
            startDate = '2025-02-01';
            endDate = '2025-02-28';
            break;
        case 'มีนาคม 2025':
        default:
            startDate = '2025-03-01';
            endDate = '2025-03-31';
            break;
    }
    
    let sql = `
        SELECT u.user_id, u.name, u.role, SUM(o.hours) as hours
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        WHERE s.shift_date BETWEEN ? AND ?
        GROUP BY u.user_id, u.name, u.role
        ORDER BY hours DESC
    `;
    
    connection.query(sql, [startDate, endDate], function(err, results, fields) {
        if (err) {
            console.error('Error fetching staff OT:', err);
            return res.status(500).json({ error: true, message: 'Error fetching staff OT' });
        }
        res.json(results);
    });
});

// ดึงข้อมูล OT แยกตามแผนก (สำหรับแสดงกราฟวงกลม)
app.get('/getDepartmentOT/', (req, res) => {
    // ข้อมูลเริ่มต้นและสิ้นสุดของเดือนที่เลือก (อาจรับเป็น query parameter)
    let month = req.query.month || 'มีนาคม 2025';
    let startDate, endDate;
    
    // แปลงชื่อเดือนไทยเป็นวันที่
    switch (month) {
        case 'มกราคม 2025':
            startDate = '2025-01-01';
            endDate = '2025-01-31';
            break;
        case 'กุมภาพันธ์ 2025':
            startDate = '2025-02-01';
            endDate = '2025-02-28';
            break;
        case 'มีนาคม 2025':
        default:
            startDate = '2025-03-01';
            endDate = '2025-03-31';
            break;
    }
    
    let sql = `
        SELECT d.dept_name as name, SUM(o.hours) as value
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Department d ON u.dept_id = d.dept_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        WHERE s.shift_date BETWEEN ? AND ?
        GROUP BY d.dept_id, d.dept_name
        ORDER BY value DESC
    `;
    
    connection.query(sql, [startDate, endDate], function(err, results, fields) {
        if (err) {
            console.error('Error fetching department OT:', err);
            return res.status(500).json({ error: true, message: 'Error fetching department OT' });
        }
        res.json(results);
    });
});

// ดึงข้อมูลสถิติประจำเดือน
app.get('/getMonthlyStats/', (req, res) => {
    // ข้อมูลเริ่มต้นและสิ้นสุดของเดือนที่เลือก (อาจรับเป็น query parameter)
    let month = req.query.month || 'มีนาคม 2025';
    let startDate, endDate;
    
    // แปลงชื่อเดือนไทยเป็นวันที่
    switch (month) {
        case 'มกราคม 2025':
            startDate = '2025-01-01';
            endDate = '2025-01-31';
            break;
        case 'กุมภาพันธ์ 2025':
            startDate = '2025-02-01';
            endDate = '2025-02-28';
            break;
        case 'มีนาคม 2025':
        default:
            startDate = '2025-03-01';
            endDate = '2025-03-31';
            break;
    }
    
    // เตรียม query สำหรับสถิติต่างๆ
    
    // 1. จำนวนเวรทั้งหมด
    const totalShiftsQuery = `
        SELECT COUNT(*) as totalShifts
        FROM Shifts
        WHERE shift_date BETWEEN ? AND ?
    `;
    
    // 2. จำนวนชั่วโมง OT รวม
    const totalOTHoursQuery = `
        SELECT SUM(hours) as totalOTHours
        FROM Overtime o
        JOIN Shifts s ON o.shift_id = s.shift_id
        WHERE s.shift_date BETWEEN ? AND ?
    `;
    
    // 3. ค่าเฉลี่ย OT ต่อคน
    const avgOTPerPersonQuery = `
        SELECT AVG(total_hours) as averageOTPerPerson
        FROM (
            SELECT u.user_id, SUM(o.hours) as total_hours
            FROM Overtime o
            JOIN Users u ON o.user_id = u.user_id
            JOIN Shifts s ON o.shift_id = s.shift_id
            WHERE s.shift_date BETWEEN ? AND ?
            GROUP BY u.user_id
        ) as user_totals
    `;
    
    // 4. คนที่มีชั่วโมง OT สูงสุด
    const highestOTQuery = `
        SELECT u.name as highestOTPerson, SUM(o.hours) as highestOTHours
        FROM Overtime o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Shifts s ON o.shift_id = s.shift_id
        WHERE s.shift_date BETWEEN ? AND ?
        GROUP BY u.user_id, u.name
        ORDER BY highestOTHours DESC
        LIMIT 1
    `;
    
    // ทำ query ทั้งหมดพร้อมกัน
    connection.query(totalShiftsQuery, [startDate, endDate], function(err1, totalShiftsResult) {
        if (err1) {
            console.error('Error fetching total shifts:', err1);
            return res.status(500).json({ error: true, message: 'Error fetching monthly stats' });
        }
        
        connection.query(totalOTHoursQuery, [startDate, endDate], function(err2, totalOTHoursResult) {
            if (err2) {
                console.error('Error fetching total OT hours:', err2);
                return res.status(500).json({ error: true, message: 'Error fetching monthly stats' });
            }
            
            connection.query(avgOTPerPersonQuery, [startDate, endDate], function(err3, avgOTResult) {
                if (err3) {
                    console.error('Error fetching average OT per person:', err3);
                    return res.status(500).json({ error: true, message: 'Error fetching monthly stats' });
                }
                
                connection.query(highestOTQuery, [startDate, endDate], function(err4, highestOTResult) {
                    if (err4) {
                        console.error('Error fetching highest OT person:', err4);
                        return res.status(500).json({ error: true, message: 'Error fetching monthly stats' });
                    }
                    
                    // รวมผลลัพธ์ทั้งหมด
                    const stats = {
                        totalShifts: totalShiftsResult[0].totalShifts || 0,
                        totalOTHours: totalOTHoursResult[0].totalOTHours || 0,
                        averageOTPerPerson: parseFloat(avgOTResult[0].averageOTPerPerson || 0).toFixed(2),
                        highestOTPerson: highestOTResult[0]?.highestOTPerson || '',
                        highestOTHours: highestOTResult[0]?.highestOTHours || 0
                    };
                    
                    res.json(stats);
                });
            });
        });
    });
});