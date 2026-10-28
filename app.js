/**
 * app.js — Логіка взаємодії з інтерфейсом та API перекладу
 * Стек: Pure JavaScript ES6+, Fetch API, RxJS 7
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. ЕЛЕМЕНТИ ІНТЕРФЕЙСУ ──────────────────────────────────────────────
  const srcLang   = document.getElementById('src-lang');
  const tgtLang   = document.getElementById('tgt-lang');
  const btnSwap   = document.getElementById('btn-swap');
  const srcText   = document.getElementById('src-text');
  const tgtText   = document.getElementById('tgt-text');
  const btnTrans  = document.getElementById('btn-translate');
  const chkAuto   = document.getElementById('chk-auto');
  const statusBox = document.getElementById('status-box');


  // ── 2. АСИНХРОННИЙ ЗАПИТ ДО API ПЕРЕКЛАДУ (FETCH + ASYNC/AWAIT) ──────────
  async function fetchTranslation(text, from, to) {
    const query = (text || '').trim();
    if (!query) return '';
    if (from === to) return query;

    // Відкрите безкоштовне REST API перекладу (MyMemory Translation API)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${from}|${to}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка сервера: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.responseStatus !== 200 && data.responseStatus !== '200') {
      throw new Error(data.responseDetails || 'Помилка виконання перекладу');
    }

    return data.responseData.translatedText;
  }


  // ── 3. ВИКОНАННЯ ТА ВІДОБРАЖЕННЯ ПЕРЕКЛАДУ ──────────────────────────────
  async function performTranslation() {
    const text = srcText.value.trim();
    const from = srcLang.value;
    const to   = tgtLang.value;

    if (!text) {
      tgtText.value = '';
      setStatus('normal', 'Введіть текст для перекладу');
      return;
    }

    // Індикація завантаження
    setStatus('loading', 'Виконується переклад...');
    btnTrans.disabled = true;

    try {
      const result = await fetchTranslation(text, from, to);
      tgtText.value = result;
      setStatus('success', 'Переклад успішно отримано');
    } catch (err) {
      console.error(err);
      setStatus('error', `Помилка: ${err.message}`);
    } finally {
      btnTrans.disabled = false;
    }
  }

  function setStatus(type, message) {
    statusBox.className = 'status-box';
    if (type !== 'normal') {
      statusBox.classList.add(type);
    }
    statusBox.textContent = message;
  }


  // ── 4. ОБРОБКА ПОДІЙ ЧЕРЕЗ RXJS (МЕТОДИЧКА: КРОК 2 ТА ДОД. ЗАВДАННЯ) ─────
  const { fromEvent } = rxjs;
  const { debounceTime, distinctUntilChanged } = rxjs.operators;

  // А) Додаткове завдання: автопереклад під час набору (debounce 500 мс)
  fromEvent(srcText, 'input')
    .pipe(
      debounceTime(500),
      distinctUntilChanged()
    )
    .subscribe(() => {
      if (chkAuto.checked) {
        performTranslation();
      }
    });

  // Б) Ручний переклад при кліку на кнопку «Перекласти»
  fromEvent(btnTrans, 'click').subscribe(() => {
    performTranslation();
  });

  // В) Додаткове завдання: кнопка «Поміняти мови місцями» з повторним перекладом
  fromEvent(btnSwap, 'click').subscribe(() => {
    const temp = srcLang.value;
    srcLang.value = tgtLang.value;
    tgtLang.value = temp;

    // Якщо в результаті вже був текст — міняємо його з вхідним
    if (tgtText.value.trim()) {
      srcText.value = tgtText.value;
      tgtText.value = '';
    }

    performTranslation();
  });

  // Г) Повторний переклад при зміні мови у списках
  fromEvent(srcLang, 'change').subscribe(() => {
    if (srcText.value.trim()) performTranslation();
  });
  fromEvent(tgtLang, 'change').subscribe(() => {
    if (srcText.value.trim()) performTranslation();
  });


  // ── 5. ПОЧАТКОВИЙ СТАН ──────────────────────────────────────────────────
  srcText.value = '';
  tgtText.value = '';
  srcText.focus();

});
