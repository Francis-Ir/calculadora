const currentEl = document.getElementById("current");
const historyEl = document.getElementById("history");
const angleToggle = document.getElementById("angleToggle");
const angleIndicator = document.getElementById("angleIndicator");

let current = "0";
let previous = null;
let operator = null;
let operandPending = false;
let replaceOnDigit = true;
let angleMode = "DEG";
let lastAnswer = 0;

const operatorSymbols = {
  "+": "+",
  "-": "\u2212",
  "*": "\u00d7",
  "/": "\u00f7",
  "^": "^"
};

function updateDisplay() {
  currentEl.textContent = current;

  if (previous !== null && operator) {
    historyEl.textContent = `${previous} ${operatorSymbols[operator]}`;
  } else {
    historyEl.textContent = "";
  }

  fitCurrent();
}

function fitCurrent() {
  currentEl.style.fontSize = "";
  let size = parseFloat(getComputedStyle(currentEl).fontSize);
  let guard = 0;

  while (currentEl.scrollWidth > currentEl.clientWidth && size > 16 && guard < 60) {
    size -= 2;
    currentEl.style.fontSize = `${size}px`;
    guard++;
  }
}

function round(n) {
  return Math.round((n + Number.EPSILON) * 1e10) / 1e10;
}

function formatNumber(n) {
  if (!Number.isFinite(n) || Number.isNaN(n)) return "Error";
  if (Math.abs(n) < 1e-12) n = 0;
  return String(round(n));
}

function inputNumber(digit) {
  if (replaceOnDigit || current === "Error") {
    current = digit === "." ? "0." : digit;
    replaceOnDigit = false;
    operandPending = false;
    return;
  }

  if (digit === ".") {
    if (current.includes(".") || current.includes("e")) return;
    current += ".";
    return;
  }

  if (current === "0") current = digit;
  else if (current === "-0") current = "-" + digit;
  else current += digit;
}

function inputExp() {
  if (current === "Error" || current.includes("e")) return;
  current += "e";
  replaceOnDigit = false;
  operandPending = false;
}

function calculate(a, b, op) {
  const x = parseFloat(a);
  const y = parseFloat(b);

  switch (op) {
    case "+":
      return x + y;
    case "-":
      return x - y;
    case "*":
      return x * y;
    case "/":
      return y === 0 ? null : x / y;
    case "^":
      return Math.pow(x, y);
    default:
      return y;
  }
}

function setOperator(op) {
  if (current === "Error") return;

  if (operator !== null && !operandPending) {
    const result = calculate(previous, current, operator);
    if (result === null) {
      resetWithError();
      return;
    }
    current = formatNumber(result);
    previous = current;
  } else if (operator === null) {
    previous = current;
  }

  operator = op;
  operandPending = true;
  replaceOnDigit = true;
}

function equals() {
  if (operator === null) return;

  const second = operandPending ? previous : current;
  const result = calculate(previous, second, operator);
  if (result === null) {
    resetWithError();
    return;
  }

  historyEl.textContent = `${previous} ${operatorSymbols[operator]} ${second} =`;
  current = formatNumber(result);
  lastAnswer = parseFloat(current);
  previous = null;
  operator = null;
  operandPending = false;
  replaceOnDigit = true;
  currentEl.textContent = current;

  setTimeout(() => {
    if (historyEl.textContent.endsWith("=")) updateDisplay();
  }, 1500);
}

function resetWithError() {
  current = "Error";
  previous = null;
  operator = null;
  operandPending = false;
  replaceOnDigit = true;
}

function clearAll() {
  current = "0";
  previous = null;
  operator = null;
  operandPending = false;
  replaceOnDigit = true;
}

function deleteLast() {
  if (replaceOnDigit || current === "Error") return;
  current = current.length > 1 ? current.slice(0, -1) : "0";
  if (current === "-" || current === "") current = "0";
}

function negate() {
  if (current === "0" || current === "Error") return;
  current = current.startsWith("-") ? current.slice(1) : "-" + current;
}

function applyValue(value) {
  if (value === null || !Number.isFinite(value) || Number.isNaN(value)) {
    resetWithError();
    return;
  }
  current = formatNumber(value);
  replaceOnDigit = true;
  operandPending = false;
}

function toRadians(value) {
  return angleMode === "DEG" ? (value * Math.PI) / 180 : value;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function applyFunction(name) {
  if (current === "Error") {
    resetWithError();
    return;
  }

  const value = parseFloat(current);
  if (Number.isNaN(value)) {
    resetWithError();
    return;
  }

  switch (name) {
    case "sin":
      applyValue(Math.sin(toRadians(value)));
      break;
    case "cos":
      applyValue(Math.cos(toRadians(value)));
      break;
    case "tan":
      applyValue(Math.tan(toRadians(value)));
      break;
    case "ln":
      applyValue(value > 0 ? Math.log(value) : null);
      break;
    case "log":
      applyValue(value > 0 ? Math.log10(value) : null);
      break;
    case "sqrt":
      applyValue(value >= 0 ? Math.sqrt(value) : null);
      break;
    case "sqr":
      applyValue(value * value);
      break;
    case "inv":
      applyValue(value !== 0 ? 1 / value : null);
      break;
    case "exp":
      applyValue(Math.exp(value));
      break;
    case "fact":
      applyValue(factorial(value));
      break;
  }
}

function percent() {
  applyValue(parseFloat(current) / 100);
}

function toggleAngle() {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  angleToggle.textContent = angleMode;
  angleIndicator.textContent = angleMode;
}

document.querySelector("main").addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;

  const ds = button.dataset;

  if (ds.number !== undefined) {
    inputNumber(ds.number);
  } else if (ds.operator !== undefined) {
    setOperator(ds.operator);
  } else if (ds.fn !== undefined) {
    applyFunction(ds.fn);
  } else if (ds.const !== undefined) {
    applyValue(ds.const === "pi" ? Math.PI : Math.E);
  } else if (ds.action !== undefined) {
    switch (ds.action) {
      case "clear":
        clearAll();
        break;
      case "delete":
        deleteLast();
        break;
      case "negate":
        negate();
        break;
      case "percent":
        percent();
        break;
      case "exp":
        inputExp();
        break;
      case "ans":
        applyValue(lastAnswer);
        break;
      case "angle":
        toggleAngle();
        break;
      case "equals":
        equals();
        return;
    }
  }

  updateDisplay();
});

document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (/^[0-9]$/.test(key)) {
    inputNumber(key);
  } else if (key === ".") {
    inputNumber(".");
  } else if (["+", "-", "*", "/", "^"].includes(key)) {
    setOperator(key);
  } else if (key === "Enter" || key === "=") {
    e.preventDefault();
    equals();
    return;
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearAll();
  } else if (key === "%") {
    percent();
  } else {
    return;
  }

  updateDisplay();
});

updateDisplay();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fitCurrent);
}
