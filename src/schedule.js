// schedule.js
// Runs the notifyDueSubscriptions job every day at 11:00 AM server time
const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('0 11 * * *', () => {
  console.log('Running daily due subscription notification job...');
  exec('node src/notifyDueSubscriptions.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running notifyDueSubscriptions: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`notifyDueSubscriptions stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`notifyDueSubscriptions output: ${stdout}`);
    }
  });
});

console.log('Scheduled due subscription notification job.');
