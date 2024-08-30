// ==UserScript==
// @name         TicketMaster UK Auto-Booker
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Auto-reserve tickets in cart for TicketMaster UK
// @match        https://www.ticketmaster.co.uk/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        none
// ==/UserScript==

var refreshIntervalSeconds = 2; // Interval to check for tickets
var numberOfTickets = 2; // Number of tickets you want

function SkipPopup() {
    var popupPresent = getElementByXpath('//button[contains(@class, "landing-modal-footer__skip-button")]');
    if (popupPresent) {
        try { popupPresent.click(); } catch (ex) { console.error('Popup skip failed', ex); }
    }
}

function CheckForFilterPanel() {
    var filterBar = getElementByXpath('//div[contains(@class, "filter-bar__content")]');
    return filterBar;
}

function ProcessFilterPanel(filterBar) {
    // Click the first available ticket in the list
    ClickElement('(//ul/li[contains(@class, "quick-picks__list-item")])[1]//div[contains(@class, "event-list-item--wrapper")]');

    // Wait for the offer card to load and process it
    waitForElement('.offer-card', function () {
        ChangeTicketQuantity();

        // Click the "Buy Tickets" button in the right-hand panel
        var getTicketsElement = ClickElement('//button[@id = "offer-card-buy-button"]');

        // Handle the dialog that appears if someone else beats you to the tickets
        waitForElement('.button-aux, .modal-dialog__button', function () {
            var sectionChangeBuyButton = getElementByXpath('//button[contains(@class, "button-aux modal-dialog__button")]');
            if (sectionChangeBuyButton) {
                sectionChangeBuyButton.click();
            }
        });
    });
}

function ChangeTicketQuantity() {
    var currentTicketCountElement = getElementByXpath('//div[contains(@class, "qty-picker__number--lg")]');
    var currentTicketCount = parseInt(currentTicketCountElement.innerText.trim(), 10);

    var ticketQuantityDifference = numberOfTickets - currentTicketCount;
    if (ticketQuantityDifference > 0) {
        var ticketIncrementElement = getElementByXpath('//button[contains(@class, "qty-picker__button--increment")]');
        for (var i = 0; i < ticketQuantityDifference; i++) {
            try { ticketIncrementElement.click(); } catch (ex) { console.error('Increment click failed', ex); }
        }
    } else if (ticketQuantityDifference < 0) {
        ticketQuantityDifference = Math.abs(ticketQuantityDifference);
        var ticketDecrementElement = getElementByXpath('//button[contains(@class, "qty-picker__button--decrement")]');
        for (var i = 0; i < ticketQuantityDifference; i++) {
            try { ticketDecrementElement.click(); } catch (ex) { console.error('Decrement click failed', ex); }
        }
    }
}

function CheckForGeneralAdmission() {
    var buyButton = getElementByXpath('//button[@id = "offer-card-buy-button"]');
    return buyButton;
}

function ProcessGeneralAdmission(generalAdmissionBuyButton) {
    ChangeTicketQuantity();
    generalAdmissionBuyButton.click();
}

function reload() {
    window.location.reload();
}

function ClickElement(path) {
    var element = getElementByXpath(path);
    if (element && typeof element.click !== 'undefined') {
        element.click();
        return element;
    }
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

var waitForElement = function (selector, callback) {
    if (jQuery(selector).length) {
        callback();
    } else {
        setTimeout(function () {
            waitForElement(selector, callback);
        }, 100);
    }
};

$(document).ready(function () {
    var success = false;

    // Close any popups that might block the process
    SkipPopup();

    // Check if there's a filter bar to select specific tickets
    if (!success) {
        var filterBar = CheckForFilterPanel();
        if (filterBar) {
            console.log('Filter bar detected');
            success = true;
            ProcessFilterPanel(filterBar);
        }
    }

    // Handle general admission tickets with no assigned seating
    if (!success) {
        var generalAdmissionBuyButton = CheckForGeneralAdmission();
        if (generalAdmissionBuyButton) {
            console.log('General admission detected');
            success = true;
            ProcessGeneralAdmission(generalAdmissionBuyButton);
        }
    }

    // If no tickets are found, refresh the page after a set interval
    if (!success) {
        setTimeout(reload, refreshIntervalSeconds * 1000);
    }
});
