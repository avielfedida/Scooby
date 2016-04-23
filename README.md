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

### Initiate with questions
Scooby can learn from scratch, meaning you would type something, it will say the same, and your response will be used for the next time when you ask scooby the same thing.

But generally your advised to go into `scooby-questions` and run `node index.js`(**check first step before**), this script is used to fill Scooby with around 1800 questions, that way Scooby will be able to ask you things right away instead of imitating you to collect questions.

There is `listToLISpanStructure.js`, this file used to help collecting more questions, for more information open the file and read the comments.

### Wrapping up:
Go into the main folder and execute:
```sh
node index.js
```

And now, check `localhost`, **Enjoy**.