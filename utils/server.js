import http from 'http';

export function startHealthCheckServer() {
  const PORT = process.env.PORT || 3000;
  http
    .createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Bot Discord OK');
    })
    .listen(PORT, () => {
      console.log(`🌐 Serveur Web Health-Check en écoute sur le port ${PORT}`);
    });
}
