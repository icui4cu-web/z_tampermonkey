// ==UserScript==
// @name         Автоматический просмотр анкет
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Автоматически посещает анкеты
// @match        https://goldenbride.net/*
// @grant        none
// ==/UserScript==
(function () {
	'use strict';

	if (window !== window.top) return;

	const DEBUG = true;
	const CARD_SELECTOR = '.profile-item';
	const CARD_VIEW_TIME = 3;
	const PAGE_DELAY = 2;
	const MAX_PAGES = 0; // 0 = без лимита

	let allIds = [];
	let isCollecting = false;
	let isViewing = false;
	let isRunning = false;
	let pagesCollected = 0;
	let pageProcessed = false;

	function log(...args) {
		if (DEBUG) {
			console.log('[AutoViewer]', ...args);
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
			console.log(allIds);
			isCollecting = false;
			// startViewing();
			return;
		}

		await wait(PAGE_DELAY);

		const nextButton = document.querySelector('.pagination .next');

		if (nextButton && isRunning) {
			log('Переход на следующую страницу');
			pageProcessed = false;
			nextButton.click();
		}
	}

	async function startViewing() {
		if (isViewing || !allIds.length) return;

		isViewing = true;

		log('Начинаем просмотр анкет');

		while (isRunning) {
			for (let i = 0; i < allIds.length && isRunning; i++) {
				const id = allIds[i];
				log(`Просмотр ${i + 1}/${allIds.length}: ID ${id}`);
				location.href = `https://goldenbride.net/lady#!VIEWMANPAGE;${id}`;
				await wait(CARD_VIEW_TIME);
			}

			log('Все анкеты просмотрены, начинаем заново');
		}

		isViewing = false;
	}
	function createControlButton() {
		if (document.getElementById('autoViewerControl')) return;

		const button = document.createElement('button');

		button.id = 'autoViewerControl';
		button.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.3s;
        `;

		const updateButton = () => {
			button.textContent = isRunning ? '⏸️' : '▶️';
			button.title = isRunning ? 'Остановить' : 'Запустить';
			button.style.background = isRunning ? '#f44336' : '#4CAF50';
		};

		button.addEventListener('click', () => {
			isRunning = !isRunning;
			log(isRunning ? 'Скрипт запущен' : 'Скрипт остановлен');
			updateButton();
			if (isRunning) {
				if (allIds.length > 0 && !isCollecting) {
					if (!isViewing) {
						startViewing();
					}
				}
				else if (!isCollecting && !isViewing) {
					isCollecting = true;
					pageProcessed = false;
				}
			}
		});

		updateButton();
		document.body.appendChild(button);
	}

	const observer = new MutationObserver(() => {
		createControlButton();
		if (isCollecting && !pageProcessed) {
			processCurrentPage();
		}
	});

	function init() {
		createControlButton();
		observer.observe(document.body, { childList: true, subtree: true });
		log('Скрипт инициализирован');
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();