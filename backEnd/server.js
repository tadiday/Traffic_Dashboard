const express = require('express')
const app = express()

app.use(express.static("public"))

app.get('/', (req, res) => {
    console.log("Got")
    res.status(200).json({message: "You got em"})
})

app.listen(3000)