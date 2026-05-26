import dotenv from 'dotenv'
dotenv.config()
import connectDB from './db/db.js'
import app from './app.js'



connectDB().then(()=>{
  app.listen(process.env.PORT || 5000,()=>{
    console.log(`server is running on port ${process.env.PORT}`)
  })
}).catch((error)=>{
  console.error(`Error: ${error.message}`)
  process.exit(1)
})

export default app



