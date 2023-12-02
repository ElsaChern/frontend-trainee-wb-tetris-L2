// Функция возвращает случайное число в заданном диапазоне
// По этому числу мы будем выбирать фигуры
export const getRandom = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Функция поворота матрицы на 90 градусов. Нужна для поворота фигур
export const rotate = (matrix) => {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  return result;
};
