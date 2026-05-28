// import dotenv from 'dotenv'
// dotenv.config({ path: "./.env" })
import connectDB from './db/db.js'
import app from './app.js'
import seedDatabase from './utils/seed.js'



connectDB().then(async ()=>{
 await seedDatabase()


  app.listen(process.env.PORT || 5000,()=>{
    console.log(`server is running on port ${process.env.PORT}`)
  })
}).catch((error)=>{
  console.error(`Error: ${error.message}`)
  process.exit(1)
})

export default app



