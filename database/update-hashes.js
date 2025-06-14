// This script generates new password hashes for the database
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function updateHashes() {
    const password = 'VGU2024!';
    const saltRounds = 12;
    
    console.log('🔐 Generating new password hashes...');
    
    const hashes = [];
    for (let i = 1; i <= 10; i++) {
        const hash = await bcrypt.hash(password, saltRounds);
        hashes.push(hash);
        console.log(`Generated hash ${i}/10`);
    }
    
    // Read current schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace the INSERT statement with new hashes
    const users = [
        "('Nguyen Van A', 'male', 20, 'student', 'student1@vgu.edu.vn', '" + hashes[0] + "', 'active', 150)",
        "('Tran Thi B', 'female', 21, 'student', 'student2@vgu.edu.vn', '" + hashes[1] + "', 'active', 200)",
        "('Le Van C', 'male', 19, 'student', 'student3@vgu.edu.vn', '" + hashes[2] + "', 'active', 75)",
        "('Pham Thi D', 'female', 22, 'student', 'student4@vgu.edu.vn', '" + hashes[3] + "', 'active', 300)",
        "('Hoang Van E', 'male', 20, 'student', 'student5@vgu.edu.vn', '" + hashes[4] + "', 'active', 125)",
        "('Vu Thi F', 'female', 21, 'student', 'student6@vgu.edu.vn', '" + hashes[5] + "', 'inactive', 50)",
        "('Do Van G', 'male', 23, 'student', 'student7@vgu.edu.vn', '" + hashes[6] + "', 'active', 175)",
        "('Dr. Nguyen Thi H', 'female', 35, 'medical_staff', 'doctor1@vgu.edu.vn', '" + hashes[7] + "', 'active', 0)",
        "('Dr. Tran Van I', 'male', 42, 'medical_staff', 'doctor2@vgu.edu.vn', '" + hashes[8] + "', 'active', 0)",
        "('Admin User', 'other', 30, 'admin', 'admin@vgu.edu.vn', '" + hashes[9] + "', 'active', 0)"
    ];
    
    const newInsert = `INSERT INTO users (name, gender, age, role, email, password_hash, status, points) VALUES\n-- Students (7)\n${users.slice(0, 7).join(',\n')},\n\n-- Medical Staff (2)\n${users.slice(7, 9).join(',\n')},\n\n-- Admin (1)\n${users[9]};`;
    
    // Replace old INSERT with new one
    const insertRegex = /INSERT INTO users \(name, gender, age, role, email, password_hash, status, points\) VALUES[\s\S]*?-- Admin \(1\)[\s\S]*?;/;
    schemaContent = schemaContent.replace(insertRegex, newInsert);
    
    // Write updated schema
    fs.writeFileSync(schemaPath, schemaContent);
    
    console.log('✅ Schema updated with new password hashes!');
    console.log('🔑 Default password for all users: VGU2024!');
    console.log('🚀 Run: docker-compose down && docker volume rm vgu_care_postgres_data && docker-compose up -d');
}

updateHashes().catch(console.error);