import app from "./app"
import config from "./config"
import { prisma } from "./lib/prisma"
import { createAdmin } from "./utils/createAdmin"

async function main() {
    try {
        
        await prisma.$connect()
        console.log("prisma connect successfully") 

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