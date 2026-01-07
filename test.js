// ==UserScript==
// @name         Тест
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Автоматически посещает анкеты
// @match        https://goldenbride.net/*
// @grant        none
// ==/UserScript==
(function () {
	'use strict';

	if (window !== window.top) return;

	alert('Tampermonkey работает')
})();