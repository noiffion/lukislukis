const socketIo = require('socket.io');

function makeIoServer(httpServer) {
  const io = socketIo(httpServer);

  let users = []; // object with id: string, name: string;

  const removeUser = (socket) => users.filter((user) => user.id !== socket.id);

  io.on('connection', (socket) => {
    socket.emit('connection', socket.id);

    socket.on('login', () => {});

    socket.on('save', (msg) => {
      socket.broadcast.emit('saving', msg);
    });

    socket.on('enter', (name) => {
      users.push({
        id: socket.id,
        name,
      });
      socket.emit('userList', users);
      socket.broadcast.emit('userList', users);
    });

    socket.on('leave', () => {
      users = removeUser(socket);
      socket.broadcast.emit('userList', users);
    });

    socket.on('disconnect', () => {
      users = removeUser(socket);
      socket.broadcast.emit('userList', users);
    });
  });

  return io;
}

module.exports = makeIoServer;
