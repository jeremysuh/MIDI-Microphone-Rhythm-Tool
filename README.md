# MIDI & Microphone Rhythm Tool

Web tool to practice instrument play alongside a MIDI file using their device microphone. Built using [React](https://reactjs.org/), [Go](https://golang.org/), [Gin](https://github.com/gin-gonic/gin) and [PostgreSQL](https://www.postgresql.org/).

Users can record themselves playing alongside selected sections of a MIDI file. After recording, a playback of both the MIDI and microphone recording can be used to determine any mistakes and/or improvements needed. 

Live Demo URL: https://midi-and-microphone-rhythm-practice.netlify.app/

![home page](./screenshots/screenshot-1.png)

Workspaces can be created for each individiual MIDI files where comments can be marked in specific time range. Users can progress either locally or on their Google accounts through Google Sign-In. 

![playlist generation](./screenshots/screenshot-2.png)

![playlist generation](./screenshots/screenshot-3.png)


## Running the project

Front-end: 
```
$ cd client
$ npm start
```

Back-end: 
```
$ cd server
$ npx nodemon
```

- Rename the env.template file in both ./client and ./server to .env and fill them out accordingly

