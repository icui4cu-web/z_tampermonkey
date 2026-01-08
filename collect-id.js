// ==UserScript==
// @name Автоматический сбор ID
// @namespace http://tampermonkey.net/
// @version 1.0
// @description Собирает ID анкет и выводит в консоль
// @match https://goldenbride.net/*
// @grant none
// ==/UserScript==

(function () {
    'use strict';
    if (window !== window.top) return;

    const DEBUG = true;
    const CARD_SELECTOR = '.profile-item';
    const PAGE_DELAY = 2;
    const MAX_PAGES = 0; // 0 = без лимита

    let allIds = [];
    let isCollecting = false;
    let pagesCollected = 0;
    let pageProcessed = false;

    function log(...args) {
        if (DEBUG) {
            console.log('[IdCollector]', ...args);
        }
    }

    function wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    function collectIds() {
        const cards = document.querySelectorAll(CARD_SELECTOR);
        const ids = [];
        cards.forEach(card => {
            const idSpan = card.querySelector('.id');
            if (idSpan) {
                const idMatch = idSpan.textContent.match(/ID:\s*(\d+)/);
                if (idMatch) {
                    ids.push(idMatch[1]);
                }
            }
        });
        return ids;
    }

    function isLastPage() {
        const nextButton = document.querySelector('.pagination .next');
        return !nextButton || nextButton.style.display === 'none' || nextButton.getAttribute('aria-hidden') === 'true';
    }

    async function processCurrentPage() {
        if (pageProcessed || !isCollecting) return;
        const ids = collectIds();
        if (!ids.length) return;
        pageProcessed = true;
        allIds.push(...ids);
        pagesCollected++;
        log(`Страница ${pagesCollected}: собрано ${ids.length} ID, всего: ${allIds.length}`);
        if (isLastPage() || (MAX_PAGES > 0 && pagesCollected >= MAX_PAGES)) {
            log(`Сбор завершен. Всего собрано ${allIds.length} ID с ${pagesCollected} страниц`);
            console.log('Собранные ID:', allIds);
            isCollecting = false;
            return;
        }
        await wait(PAGE_DELAY);
        const nextButton = document.querySelector('.pagination .next');
        if (nextButton) {
            log('Переход на следующую страницу');
            pageProcessed = false;
            nextButton.click();
        }
    }

    const observer = new MutationObserver(() => {
        if (isCollecting && !pageProcessed) {
            processCurrentPage();
        }
    });

    function init() {
        observer.observe(document.body, { childList: true, subtree: true });
        isCollecting = true;
        pageProcessed = false;
        processCurrentPage();
        log('Скрипт инициализирован');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();