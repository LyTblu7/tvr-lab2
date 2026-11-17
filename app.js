const { fromEvent, merge } = rxjs;
const { debounceTime, map, switchMap } = rxjs.operators;

const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const translateBtn = document.getElementById('translate-btn');
const swapBtn = document.getElementById('swap-btn');
const statusEl = document.getElementById('status');

async function translate(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (Number(data.responseStatus) !== 200) {
    throw new Error(data.responseDetails || 'Помилка сервісу перекладу');
  }

  return data.responseData.translatedText;
}

async function handleTranslate(isManual) {
  const text = sourceText.value.trim();
  const from = sourceLang.value;
  const to = targetLang.value;

  if (!text) {
    return {
      text: '',
      status: isManual ? 'Введіть текст для перекладу' : '',
      isError: isManual,
    };
  }

  if (from === to) {
    return { text, status: '', isError: false };
  }

  statusEl.textContent = 'Переклад...';
  statusEl.className = '';

  try {
    const translated = await translate(text, from, to);
    return { text: translated, status: '', isError: false };
  } catch (err) {
    return { text: null, status: `Помилка: ${err.message}`, isError: true };
  }
}

const input$ = fromEvent(sourceText, 'input').pipe(
  debounceTime(500),
  map(() => false)
);

const click$ = fromEvent(translateBtn, 'click').pipe(
  map(() => true)
);

const langChange$ = merge(
  fromEvent(sourceLang, 'change'),
  fromEvent(targetLang, 'change')
).pipe(map(() => false));

const swap$ = fromEvent(swapBtn, 'click').pipe(
  map(() => {
    [sourceLang.value, targetLang.value] = [targetLang.value, sourceLang.value];
    if (targetText.value.trim()) {
      sourceText.value = targetText.value;
      targetText.value = '';
    }
    return false;
  })
);

merge(input$, click$, langChange$, swap$)
  .pipe(switchMap((isManual) => handleTranslate(isManual)))
  .subscribe(({ text, status, isError }) => {
    if (text !== null) {
      targetText.value = text;
    }
    statusEl.textContent = status;
    statusEl.className = isError ? 'error' : '';
  });
