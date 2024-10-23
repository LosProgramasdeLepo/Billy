const { exec } = require('child_process');

// Iniciar el servidor
const server = exec('npm start --prefix C:\\Users\\Mauro\\Documents\\ITBA\\Tercero_1C\\IngenieriaSoftware\\billy-ai');

server.stdout.on('data', (data) => {
    console.log(`Servidor: ${data}`);
});

server.stderr.on('data', (data) => {
    console.error(`Error del servidor: ${data}`);
});

// Iniciar Expo en una nueva ventana
exec('start cmd /k npx expo start', (error) => {
    if (error) {
        console.error(`Error al iniciar Expo: ${error.message}`);
        return;
    }
});
