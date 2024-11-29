const express = require('express');
const app = express();

// Redirect all requests to the GitHub URL
app.get('*', (req, res) => {
    res.redirect('https://github.com/pastorius');
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
