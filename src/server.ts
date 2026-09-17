import app from "./app"
import config from "./config"
import { transporter } from "./lib/nodemailer"
import { prisma } from "./lib/prisma"
import { Redisclient } from "./lib/redis"
import { createAdmin } from "./utils/createAdmin"

async function main() {
    try {
        
        await prisma.$connect()
        console.log("prisma connect successfully") 
        await Redisclient.connect()
        console.log("redis connect successfully")
        

        await transporter.verify()
        console.log("nodemalier connect")


        await createAdmin()

        app.listen(config.PORT,()=>{
            console.log(`server is runngin PORT ${config.PORT}`)
        })
    } catch (error) {
        console.log("server error",error)
         await prisma.$disconnect();
        process.exit(1)
    }
}

main()