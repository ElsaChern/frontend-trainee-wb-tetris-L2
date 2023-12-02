import { colors, figures } from "./constants.js";
import { getRandom, rotate } from "./helpers.js";

// получаем доступ к холсту, кнопке старта и надписи результата
const playingField = document.querySelector("#playing_field");
const context = playingField.getContext("2d");
const start = document.querySelector("#start");
const score = document.querySelector(".score");

// Обозначим размер игрового поля как 20 строк на 10 столбцов
// Изначально он будет пустым массивом
let playfield = [];
// Исходя из размеров игрового поля (640х320) размер квадратика будет состовлять 640/20 и 320/10
const square = 32;
// массив с последовательностями фигур, также изначально будет пустой
let figuresSequence = [];
// Очки будем считать при удалении одной строки блоков, а изначально результат будет равен 0
let totalScore = 0;
// счётчик кадров анимации
let framesCount = 0;
// следим за кадрами анимации, чтобы вовремя — остановить игру
let rAF = null;
// Флаг "конец игры"
let gameOver = false;
// текущая фигура в игре
let figure;

// Заполним массив пустыми ячейками
// Чтобы у фигур при заполнении всего поля не было наложения друг на друга - несколько строк оставим за видимой областью игрового поля
const prepareField = () => {
  // playfield
  for (let row = -2; row < 20; row++) {
    playfield[row] = [];

    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }
};

// Функция для завершения игры
const showGameOver = () => {
  // rAF, gameOver, context, playingField,
  // прекращаем всю анимацию игры
  cancelAnimationFrame(rAF);
  // ставим флаг окончания
  gameOver = true;
  // рисуем чёрный прямоугольник посередине поля
  context.fillStyle = "black";
  context.globalAlpha = 0.75;
  context.fillRect(0, playingField.height / 2 - 30, playingField.width, 60);
  // пишем надпись белым моноширинным шрифтом по центру
  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "36px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    "GAME OVER!",
    playingField.width / 2,
    playingField.height / 2,
  );
};

// Создадим случайную последовательность фигур, которая появится в игре
const generateSequence = () => {
  // figuresSequence
  const sequence = ["I", "J", "L", "O", "S", "T", "Z"];

  while (sequence.length) {
    const randomFig = getRandom(0, sequence.length - 1);
    const name = sequence.splice(randomFig, 1)[0];
    //  Поместим выбранную фигуру в игровой массив
    figuresSequence.push(name);
  }
};

// получаем следующую фигуру
const getNextFigure = () => {
  // figuresSequence, figures, playfield,
  // Если массив пустой - сгенерируем случайную фигуру
  if (figuresSequence.length === 0) {
    generateSequence();
  }
  // берём первую фигуру из массива
  const name = figuresSequence.pop();
  // сразу создаём матрицу, с которой мы отрисуем фигуру
  const matrix = figures[name];

  // I и O стартуют с середины, остальные — чуть левее
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

  // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
  const row = name === "I" ? -1 : -2;

  // вот что возвращает функция
  return {
    name: name,
    matrix: matrix,
    row: row,
    col: col,
  };
};

// проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
const isValidMove = (matrix, cellRow, cellCol) => {
  // playfield
  // проверяем все строки и столбцы
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // если выходит за границы поля…
        (cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          // …или пересекается с другими фигурами
          playfield[cellRow + row][cellCol + col])
      ) {
        return false;
      }
    }
  }
  // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
  return true;
};

// когда фигура окончательна встала на своё место
const placeFigure = () => {
  // figure, playfield, totalScore, score,
  // обрабатываем все строки и столбцы в игровом поле
  for (let row = 0; row < figure.matrix.length; row++) {
    for (let col = 0; col < figure.matrix[row].length; col++) {
      if (figure.matrix[row][col]) {
        // если край фигуры после установки вылезает за границы поля, то игра закончилась
        if (figure.row + row < 0) {
          return showGameOver();
        }
        // если всё в порядке, то записываем в массив игрового поля нашу фигуру
        playfield[figure.row + row][figure.col + col] = figure.name;
      }
    }
  }

  // проверяем, чтобы заполненные ряды очистились снизу вверх
  for (let row = playfield.length - 1; row >= 0; ) {
    // если ряд заполнен
    if (playfield[row].every((cell) => !!cell)) {
      totalScore += 10;
      score.textContent = `Счет: ${totalScore}`;

      // очищаем его и опускаем всё вниз на одну клетку
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r - 1][c];
        }
      }
    } else {
      // переходим к следующему ряду
      row--;
    }
  }
  // получаем следующую фигуру
  figure = getNextFigure();
};

// следим за нажатиями на клавиши
document.addEventListener("keydown", function (e) {
  // gameOver, figure,
  // если игра закончилась — сразу выходим
  if (gameOver) return;

  // стрелки влево и вправо
  if (e.which === 37 || e.which === 39) {
    const col =
      e.which === 37
        ? // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
          figure.col - 1
        : figure.col + 1;

    // если так ходить можно, то запоминаем текущее положение
    if (isValidMove(figure.matrix, figure.row, col)) {
      figure.col = col;
    }
  }

  // стрелка вверх — поворот
  if (e.which === 38) {
    // поворачиваем фигуру на 90 градусов
    const matrix = rotate(figure.matrix);
    // если так ходить можно — запоминаем
    if (isValidMove(matrix, figure.row, figure.col)) {
      figure.matrix = matrix;
    }
  }

  // стрелка вниз — ускорить падение
  if (e.which === 40) {
    // смещаем фигуру на строку вниз
    const row = figure.row + 1;
    // если опускаться больше некуда — запоминаем новое положение
    if (!isValidMove(figure.matrix, row, figure.col)) {
      figure.row = row - 1;
      // ставим на место и смотрим на заполненные ряды
      placeFigure();
      return;
    }
    // запоминаем строку, куда стала фигура
    figure.row = row;
  }
});

// главный цикл игры
const loop = () => {
  // rAF, context, playingField, playfield, colors, square, figure, framesCount
  // начинаем анимацию
  rAF = requestAnimationFrame(loop);
  // очищаем холст
  context.clearRect(0, 0, playingField.width, playingField.height);

  // рисуем игровое поле с учётом заполненных фигур
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];

        // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
        context.fillRect(col * square, row * square, square - 1, square - 1);
      }
    }
  }

  // рисуем текущую фигуру
  if (figure) {
    // фигура сдвигается вниз каждые 35 кадров
    if (++framesCount > 35) {
      figure.row++;
      framesCount = 0;

      // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
      if (!isValidMove(figure.matrix, figure.row, figure.col)) {
        figure.row--;
        placeFigure();
      }
    }

    // не забываем про цвет текущей фигуры
    context.fillStyle = colors[figure.name];

    // отрисовываем её
    for (let row = 0; row < figure.matrix.length; row++) {
      for (let col = 0; col < figure.matrix[row].length; col++) {
        if (figure.matrix[row][col]) {
          // и снова рисуем на один пиксель меньше
          context.fillRect(
            (figure.col + col) * square,
            (figure.row + row) * square,
            square - 1,
            square - 1,
          );
        }
      }
    }
  }
};

// старт игры
start.addEventListener("click", () => {
  playfield = [];
  figuresSequence = [];
  totalScore = 0;
  framesCount = 0;
  rAF = null;
  gameOver = false;
  prepareField();
  figure = getNextFigure();

  playingField.style.display = "block";
  score.style.display = "contents";
  score.textContent = `Счет: ${totalScore}`;

  rAF = requestAnimationFrame(loop);
});
