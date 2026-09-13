import                       './config/env.js'
import {sql}            from '#db'
import {errorHandler}   from '#error-handler'
import express          from 'express';
import cors             from 'cors';
import router           from './router.js';
import morgan           from 'morgan'
import {startMySongsCleanupSchedule} from '#scheduled-tasks/delete-expired-demo-songs/delete-expired-demo-songs.schedule.js'






const app       = express();
const PORT      = process.env.PORT || 3005;

startMySongsCleanupSchedule();

app.use(express.json()  );
app.use(cors()          );
app.use(morgan("tiny")  );
app.use("/api", router  );


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use("/api/respondTest", async (req,res)=>{
  return res.status(201).json({message: "i live"})
})


//It is used for checking state of backend
app.use("/api/health", async(req,res)=>{
  try{
    console.log(`health check`);
    await sql`SELECT 1`;
    return res.status(200).json({status: "ok", database: "connected"});
  }catch(err){
    return res.status(503).json({status: "error", database: "disconnected"});
  }
})


app.use(errorHandler);