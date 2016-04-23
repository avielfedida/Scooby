# Scooby
Scooby is a really cool chat bot, it automatically learn to response by chatting experiences.

### First step:
Go into `index.ts` and set `mongoPASS`, `USERNAME`, and `DATABASE_NAME`, also go into `scooby-questions/index.js` and change their as well.

### Second step(npm installs):
```sh
npm install
cd public & npm install
cd scooby-questions & npm install
```

### Third step:
```sh
npm install -g typescript // If required
tsc --watch index.ts dbCommunicator.ts normalizer.ts vald.ts --target ES6 --module commonjs
```

### Fourth step(sass is required):
```sh
cd public & sass --watch styles
```

### Wrapping up:
```sh
node index.js
```

And now, check `localhost`, **Enjoy**.