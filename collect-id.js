// ==UserScript==
// @name         Сбор ID анкет
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Собирает ID анкет со всех страниц и выводит в консоль
// @match        https://goldenbride.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (window !== window.top) return;

    const CARD_SELECTOR = '.profile-item';
    const PAGE_DELAY = 2;
    const MAX_PAGES = 0; // 0 = без лимита

    let allIds = [];
    let pagesCollected = 0;
    let isRunning = false;
    let pageProcessed = false;

    function log(...args) {
        console.log('[ID Collector]', ...args);
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
        return !nextButton || 
               nextButton.style.display === 'none' || 
               nextButton.getAttribute('aria-hidden') === 'true';
    }

    async function processCurrentPage() {
        if (pageProcessed || !isRunning) return;

        const ids = collectIds();
        if (!ids.length) return;

        pageProcessed = true;
        allIds.push(...ids);
        pagesCollected++;

        log(`Страница ${pagesCollected}: собрано ${ids.length} ID, всего: ${allIds.length}`);

        if (isLastPage() || (MAX_PAGES > 0 && pagesCollected >= MAX_PAGES)) {
            log(`\n=== СБОР ЗАВЕРШЁН ===`);
            log(`Всего собрано: ${allIds.length} ID с ${pagesCollected} страниц`);
            log(`\nСписок ID:`);
            console.log(allIds);
            log(`\nID через запятую:`);
            console.log(allIds.join(', '));
            isRunning = false;
            updateButton();
            return;
        }

        await wait(PAGE_DELAY);

        const nextButton = document.querySelector('.pagination .next');
        if (nextButton && isRunning) {
            log('Переход на следующую страницу...');
            pageProcessed = false;
            nextButton.click();
        }
    }

    function createControlButton() {
        if (document.getElementById('idCollectorControl')) return;

        const button = document.createElement('button');
        button.id = 'idCollectorControl';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.3s;
        `;

        button.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                allIds = [];
                pagesCollected = 0;
                pageProcessed = false;
                log('Запуск сбора ID...');
                updateButton();
            }
        });

        updateButton();
        document.body.appendChild(button);

        function updateButton() {
            button.textContent = isRunning ? 'Идёт сбор...' : 'Собрать ID';
            button.style.background = isRunning ? '#ff9800' : '#4CAF50';
            button.style.cursor = isRunning ? 'not-allowed' : 'pointer';
            button.disabled = isRunning;
        }

        window.updateButton = updateButton;
    }

    const observer = new MutationObserver(() => {
        createControlButton();
        if (isRunning && !pageProcessed) {
            processCurrentPage();
        }
    });

    function init() {
        createControlButton();
        observer.observe(document.body, { childList: true, subtree: true });
        log('Скрипт готов к работе. Нажмите кнопку "Собрать ID"');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();