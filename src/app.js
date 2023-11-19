import express from 'express'
import { configViewEngine } from './configs/index'
import { initWebRoutes, initAPIRoute } from './routes/index'

const hostName = '127.0.0.1'
const port = 8080
const app = express()

app.use(express.urlencoded({ extends: true }))
app.use(express.json())

configViewEngine(app)
initWebRoutes(app)
initAPIRoute(app)

app.listen(port, () => {
    console.log(`Your app is running at http://${hostName}:${port}/`);
})