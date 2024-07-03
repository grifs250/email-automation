const express = require('express');
const app = express();
const emails = require('./routes/emails')


// middlewear

app.use(express.json())



// routes
app.get('/hello', (req, res)=>{
    res.send("Email automation")
})

app.use('/api/v1/emails', emails)

// get main.html
// get tenx.html
// post name


const port = 3000


app.listen (port, console.log(`Server is listening on port ${port}...`))