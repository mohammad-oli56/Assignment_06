import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import config from './config';
import cookieParser from 'cookie-parser';
import { authRouts } from './module/auth/auth.router';
import { ZoneRouter } from './module/POWER_OPERATOR/Zone/zone.router';
import { custometOutageRouter } from './module/customer/Outage/outage.router';

const app :Application = express()

app.use(cors({
    origin : config.APP_URL,
    credentials : true
}))
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))
app.use(cookieParser())

app.get("/",(req : Request,res : Response)=>{
    res.send("Server is running!!!!!")
})

app.use("/api/v1/auth",authRouts)



//customer 
app.use("/api/v1/customer/outages",custometOutageRouter)




//power operator
app.use("/api/v1",ZoneRouter)


export default app;