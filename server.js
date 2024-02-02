const express = require('express');
const bodyParser = require('body-parser');
const { Rcon } = require('rcon-client');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Read server credentials from the configuration file
const configPath = './config.json'; // Update with the correct path
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Middleware for authenticating requests (add proper authentication)
const authenticate = (req, res, next) => {
  // Implement proper authentication logic here
  // For simplicity, it's skipped in this example
  next();
};

app.use(authenticate);

// Function to send RCON command
const sendRconCommand = async (command) => {
  try {
    const rconOptions = {
      host: config.serverIp,
      port: config.serverPort,
      password: config.rconPassword,
    };

    const rcon = await Rcon.connect(rconOptions);

    // Send the command
    const response = await rcon.send(command);
    console.log('RCON command sent:', command);
    console.log('RCON response:', response);

    // Disconnect (close) the RCON connection
    await rcon.end();
  } catch (error) {
    console.error('Error sending RCON command:', error.message);
  }
};

// Route to send RCON commands
app.post('/sendCommand', async (req, res) => {
  const { command } = req.body;

  // Send the RCON command
  await sendRconCommand(command);

  // Respond to the client without logging the result of sendRconCommand
  res.json({ success: true, message: 'Command processed successfully' });
});

// Route to handle additional controls
app.post('/control', async (req, res) => {
  const { action, value } = req.body;

  switch (action) {
    case 'map':
      await sendRconCommand(`changelevel ${value}`);
      break;
    case 'cheats':
      await sendRconCommand(`sv_cheats ${value}`);
      break;
    case 'friendlyFire':
      await sendRconCommand(`mp_friendlyfire ${value}`);
      break;
    case 'pause':
    case 'unpause':
      await sendRconCommand(`mp_${action}_match`);
      break;
    case 'hostname':
      await sendRconCommand(`hostname "${value}"`);
      break;
    default:
      res.json({ success: false, message: 'Invalid action.' });
      return;
  }

  res.json({ success: true, message: 'Control processed successfully' });
});

// Route handler for the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
