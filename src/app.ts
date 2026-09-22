import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import config from './config';
import cookieParser from 'cookie-parser';
import { authRouts } from './module/auth/auth.router';
import { ZoneRouter } from './module/POWER_OPERATOR/Zone/zone.router';
import { custometOutageRouter } from './module/CUSTOMER/Outage/outage.router';
import { ServiceRequestRouter } from './module/CUSTOMER/service_request/service_request.router';
import { PowerOperatorRouter } from './module/POWER_OPERATOR/Outage/P.outage.router';
import { adminRouter } from './module/admin/admin.router';
import { PowerOperatorTechnicianRouter } from './module/POWER_OPERATOR/Technician/P.technician.router';
import { AssignedServiceRouter } from './module/TECHNICIAN/assigned-service/assigned-service.route';
import { AssignedOutageRouter } from './module/TECHNICIAN/assigned-outage/assigned-outage.route';
import { ServiceRequestRouterOperator } from './module/POWER_OPERATOR/ServiceRequest/servicerequest.router';

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
app.use("/api/v1/customer/service-requests",ServiceRequestRouter)




//power operator
app.use("/api/v1",ZoneRouter)
app.use("/api/v1/power-operator/outages",PowerOperatorRouter)
app.use("/api/v1/power-operator/technician",PowerOperatorTechnicianRouter)
app.use("/api/v1/power-operator/schedules",PowerOperatorRouter)
app.use("/api/v1/power-operator/service-requests",ServiceRequestRouterOperator)





//technician
app.use("/api/v1/technician/services",AssignedServiceRouter)
app.use("/api/v1/technician/outages",AssignedOutageRouter)





//admin
app.use("/api/v1/admin",adminRouter)







export default app;