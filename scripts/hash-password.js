const bcrypt = require('bcryptjs');
const password = 'Admin123!';
console.log('Password:', password);
const hash = bcrypt.hashSync(password, 12);
console.log('Hash:', hash);
// Verify
const match = bcrypt.compareSync(password, hash);
console.log('Verify:', match);
