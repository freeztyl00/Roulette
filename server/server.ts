import { createServer } from "http";
import { Server } from "socket.io";
import {
  GameData,
  GameStages,
  PlacedChip,
  ValueType,
  Winner,
} from "../src/Global";
import { Timer } from "easytimer.js";

/** Server Handling */
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const port = 8000;
var timer = new Timer();
var users = new Map<string, string>();
let gameData = {} as GameData;
let usersData = {} as Map<string, PlacedChip[]>;
let wins = [] as Winner[];
timer.addEventListener("secondsUpdated", function (e: any) {
  var currentSeconds = timer.getTimeValues().seconds;
  gameData.time_remaining = currentSeconds;
  if (currentSeconds == 1) {
    console.log("Place bet");
    usersData = new Map();
    gameData.stage = GameStages.PLACE_BET;
    wins = [];
    sendStageEvent(gameData);
  } else if (currentSeconds == 25) {
    gameData.stage = GameStages.NO_MORE_BETS;
    gameData.value = getRandomNumberInt(0, 36);
    console.log("No More Bets");
    sendStageEvent(gameData);

    for (let key of Array.from(usersData.keys())) {
      var username = users.get(key);
      if (username != undefined) {
        var chipsPlaced = usersData.get(key) as PlacedChip[];
        var sumWon = calculateWinnings(gameData.value, chipsPlaced);
        wins.push({
          username: username,
          sum: sumWon,
        });
      }
    }
  } else if (currentSeconds == 35) {
    console.log("Winners");
    gameData.stage = GameStages.WINNERS;
    // sort winners desc
    if (gameData.history == undefined) {
      gameData.history = [];
    }
    gameData.history.push(gameData.value);

    if (gameData.history.length > 10) {
      gameData.history.shift();
    }
    gameData.wins = wins.sort((a, b) => b.sum - a.sum);
    sendStageEvent(gameData);
  }
});

io.on("connection", (socket) => {
  socket.on("enter", (data: string) => {
    users.set(socket.id, data);
    sendStageEvent(gameData);
  });

  socket.on("place-bet", (data: string) => {
    var gameData = JSON.parse(data) as PlacedChip[];
    usersData.set(socket.id, gameData);
  });
  socket.on("disconnect", (reason) => {
    users.delete(socket.id);
    usersData.delete(socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  timer.start({ precision: "seconds" });
});

function getRandomNumberInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendStageEvent(_gameData: GameData) {
  var json = JSON.stringify(_gameData);
  console.log(json);
  io.emit("stage-change", json);
}

var blackNumbers = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 28, 31, 33, 35,
];
var redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

function calculateWinnings(winningNumber: number, placedChips: PlacedChip[]) {
  var win = 0;
  placedChips.forEach((placedChip) => {
    const { type, value, valueSplit } = placedChip.item;
    const { sum } = placedChip;

    if (type === ValueType.NUMBER && type === winningNumber) {
      win += sum * 36;
    } else if (
      type === ValueType.BLACK &&
      blackNumbers.includes(winningNumber)
    ) {
      win += sum * 2;
    } else if (type === ValueType.RED && redNumbers.includes(winningNumber)) {
      win += sum * 2;
    } else if (
      type === ValueType.NUMBERS_1_18 &&
      winningNumber >= 1 &&
      winningNumber <= 18
    ) {
      win += sum * 2;
    } else if (
      type === ValueType.NUMBERS_19_36 &&
      winningNumber >= 19 &&
      winningNumber <= 36
    ) {
      win += sum * 2;
    } else if (
      type === ValueType.NUMBERS_1_12 &&
      winningNumber >= 1 &&
      winningNumber <= 12
    ) {
      win += sum * 3;
    } else if (
      type === ValueType.NUMBERS_2_12 &&
      winningNumber >= 13 &&
      winningNumber <= 24
    ) {
      win += sum * 3;
    } else if (
      type === ValueType.NUMBERS_3_12 &&
      winningNumber >= 25 &&
      winningNumber <= 36
    ) {
      win += sum * 3;
    } else if (type === ValueType.EVEN || type === ValueType.ODD) {
      if (winningNumber % 2 == 0) {
        win += sum * 2;
      } else {
        win += sum * 2;
      }
    } else if (
      type === ValueType.DOUBLE_SPLIT &&
      valueSplit.includes(winningNumber)
    ) {
      win += sum * 18;
    } else if (
      type === ValueType.TRIPLE_SPLIT &&
      valueSplit.includes(winningNumber)
    ) {
      win += sum * 12;
    } else if (
      type === ValueType.QUAD_SPLIT &&
      valueSplit.includes(winningNumber)
    ) {
      win += sum * 9;
    }
    // else if (
    //   type === ValueType.COLUMN_1 &&
    //   [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(winningNumber)
    // ) {
    //   win += sum * 3;
    // } else if (
    //   type === ValueType.COLUMN_2 &&
    //   [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(winningNumber)
    // ) {
    //   win += sum * 3;
    // } else if (
    //   type === ValueType.COLUMN_3 &&
    //   [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(winningNumber)
    // ) {
    //   win += sum * 3;
    // }
  });
  return win;
}
