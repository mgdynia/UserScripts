// ==UserScript==
// @name        Proton Mail - Hide Quoted History Inside Replies
// @namespace   Violentmonkey Scripts
// @match       *://mail.proton.me/*
// @grant       none
// @version     0.1
// @author      MGdynia
// @description Proton Mail - Hides the first blockquote HTML inside the email content iframe.
// ==/UserScript==

(function() {
    'use strict';

    function processBlockquote(quote, iframeDoc) {
        quote.dataset.quoteHidden = 'true';
        quote.style.display = 'none';

        // We MUST use the iframe's document to create the element, or it won't show up inside the email body
        const toggleBtn = iframeDoc.createElement('button');
        toggleBtn.textContent = '...';

        toggleBtn.style.cssText = `
            background-color: #f1f3f4;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 4px 16px;
            cursor: pointer;
            font-weight: bold;
            color: #111;
            margin: 10px 0;
            display: block;
            transition: background-color 0.2s ease;
        `;

        toggleBtn.onmouseover = () => toggleBtn.style.backgroundColor = '#e0e4e8';
        toggleBtn.onmouseout = () => toggleBtn.style.backgroundColor = '#f1f3f4';

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (quote.style.display === 'none') {
                quote.style.display = 'block';
            } else {
                quote.style.display = 'none';
            }
        });

        quote.parentNode.insertBefore(toggleBtn, quote);
    }

    function checkIframe(iframe) {
        try {
            // Access the internal DOM of the iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc || !iframeDoc.body) return;

            // Immediately check if the target exists using our single querySelector
            const targetQuote = iframeDoc.querySelector('div.WordSection1 blockquote:not([data-quote-hidden="true"])');
            if (targetQuote) {
                processBlockquote(targetQuote, iframeDoc);
            }

            // Because email content might take a split second to load inside the iframe,
            // we attach a dedicated observer to the iframe's body.
            if (!iframe.dataset.observerAttached) {
                iframe.dataset.observerAttached = 'true';

                const iframeObserver = new MutationObserver(() => {
                    const quote = iframeDoc.querySelector('div.WordSection1 blockquote:not([data-quote-hidden="true"])');
                    if (quote) {
                        processBlockquote(quote, iframeDoc);
                    }
                });

                iframeObserver.observe(iframeDoc.body, { childList: true, subtree: true });
            }
        } catch (e) {
            // Fails silently if the iframe is cross-origin or restricted before fully loading
        }
    }

    // Main observer watches the Proton Mail interface for new iframes being added
    const mainObserver = new MutationObserver(() => {
        // Find all email iframes that haven't had an observer attached yet
        const iframes = document.querySelectorAll('[data-testid="content-iframe"]:not([data-observer-attached="true"])');

        // We use a standard for...of loop here to process multiple iframes if you expand a long thread
        for (const iframe of iframes) {
            // Wait a tiny bit to ensure the iframe has initialized its contentDocument
            iframe.addEventListener('load', () => checkIframe(iframe), { once: true });
            // Also check immediately in case it's already loaded
            checkIframe(iframe);
        }
    });

    mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
