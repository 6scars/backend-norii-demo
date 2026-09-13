import app from './app.js';
import { startDeleteExpiredDemoSongsSchedule } from '#scheduled-tasks/delete-expired-demo-songs/delete-expired-demo-songs.schedule.js';

const PORT = process.env.PORT || 3005;

startDeleteExpiredDemoSongsSchedule();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
