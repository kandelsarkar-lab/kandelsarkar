/* =========================================================
   KANDEL SARKAR - FIRST-PARTY COOKIE CONSENT
   - Remembers the visitor's choice
   - Counts visits only after "Accept cookies"
   - Never sets third-party or advertising cookies
========================================================= */

(function (global) {
    "use strict";

    var CONSENT_COOKIE = "ks_cookie_consent";
    var VISITS_COOKIE = "ks_visits";
    var FIRST_VISIT_COOKIE = "ks_first_visit";
    var LAST_VISIT_COOKIE = "ks_last_visit";
    var SESSION_FLAG = "ks_cookie_visit_counted";
    var ONE_YEAR = 60 * 60 * 24 * 365;

    function readCookie(name) {
        try {
            var parts = document.cookie ? document.cookie.split("; ") : [];

            for (var i = 0; i < parts.length; i += 1) {
                var eq = parts[i].indexOf("=");

                if (eq > -1 && parts[i].slice(0, eq) === name) {
                    return decodeURIComponent(parts[i].slice(eq + 1));
                }
            }
        } catch (error) {
            /* Cookies may be blocked. */
        }

        return "";
    }

    function setCookie(name, value, maxAge) {
        try {
            document.cookie =
                name + "=" + encodeURIComponent(value) +
                "; Max-Age=" + maxAge +
                "; Path=/; SameSite=Lax";
        } catch (error) {
            /* Cookies may be blocked. */
        }
    }

    function deleteCookie(name) {
        try {
            document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
        } catch (error) {
            /* Cookies may be blocked. */
        }
    }

    function consentValue() {
        return readCookie(CONSENT_COOKIE);
    }

    function countVisit() {
        if (consentValue() !== "accepted") return;

        var visits = parseInt(readCookie(VISITS_COOKIE), 10);

        if (!Number.isFinite(visits) || visits < 0) visits = 0;

        var alreadyCounted = false;

        try {
            alreadyCounted = global.sessionStorage.getItem(SESSION_FLAG) === "1";
        } catch (error) {
            /* Session storage may be blocked. */
        }

        if (!alreadyCounted) {
            visits += 1;
            setCookie(VISITS_COOKIE, String(visits), ONE_YEAR);

            try {
                global.sessionStorage.setItem(SESSION_FLAG, "1");
            } catch (error) {
                /* Session storage may be blocked. */
            }
        }

        setCookie(LAST_VISIT_COOKIE, new Date().toISOString(), ONE_YEAR);

        if (!readCookie(FIRST_VISIT_COOKIE)) {
            setCookie(FIRST_VISIT_COOKIE, new Date().toISOString(), ONE_YEAR);
        }
    }

    function clearTrackingCookies() {
        deleteCookie(VISITS_COOKIE);
        deleteCookie(FIRST_VISIT_COOKIE);
        deleteCookie(LAST_VISIT_COOKIE);
        deleteCookie("ks_mcq_progress");
    }

    function applyConsent(value) {
        setCookie(CONSENT_COOKIE, value, ONE_YEAR);

        if (value === "accepted") {
            countVisit();
        } else {
            clearTrackingCookies();
        }

        if (global.MCQTracker && typeof global.MCQTracker.refreshCookie === "function") {
            global.MCQTracker.refreshCookie();
        }

        hideBanner();

        try {
            global.dispatchEvent(new CustomEvent("ks:cookie-consent", {
                detail: { value: value }
            }));
        } catch (error) {
            /* Older browsers. */
        }
    }

    var banner = null;
    var hideTimer = null;

    function ensureBanner() {
        if (banner) return banner;

        banner = document.createElement("div");
        banner.id = "cookie-consent-banner";
        banner.className = "cookie-consent";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-label", "Cookie consent");
        banner.innerHTML =
            '<div class="cookie-consent-inner">' +
                '<div class="cookie-consent-icon" aria-hidden="true">🍪</div>' +
                '<div class="cookie-consent-copy">' +
                    '<strong>Cookies &amp; privacy</strong>' +
                    '<p>I use a first-party cookie to remember this choice and count visits. ' +
                    'Your quiz progress is stored in your browser. No ads or third-party tracking.</p>' +
                '</div>' +
                '<div class="cookie-consent-actions">' +
                    '<button type="button" class="cookie-btn essential" data-cookie-choice="essential">Essential only</button>' +
                    '<button type="button" class="cookie-btn accept" data-cookie-choice="accepted">Accept cookies</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(banner);

        banner.querySelectorAll("[data-cookie-choice]").forEach(function (button) {
            button.addEventListener("click", function () {
                applyConsent(button.getAttribute("data-cookie-choice"));
            });
        });

        return banner;
    }

    function showBanner() {
        var node = ensureBanner();

        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        node.hidden = false;

        requestAnimationFrame(function () {
            node.classList.add("visible");
        });
    }

    function hideBanner() {
        if (!banner) return;

        banner.classList.remove("visible");

        hideTimer = setTimeout(function () {
            if (banner) banner.hidden = true;
            hideTimer = null;
        }, 260);
    }

    function addFooterSettings() {
        var footers = document.querySelectorAll("footer");

        footers.forEach(function (footer) {
            if (footer.querySelector(".cookie-settings-link")) return;

            var button = document.createElement("button");
            button.type = "button";
            button.className = "cookie-settings-link";
            button.textContent = "Cookie settings";

            button.addEventListener("click", function () {
                deleteCookie(CONSENT_COOKIE);
                showBanner();
            });

            var links = footer.querySelector(".footer-links");

            if (links) {
                links.appendChild(button);
            } else {
                footer.appendChild(button);
            }
        });
    }

    function init() {
        addFooterSettings();

        if (!consentValue()) {
            showBanner();
            return;
        }

        if (consentValue() === "accepted") {
            countVisit();

            if (global.MCQTracker && typeof global.MCQTracker.refreshCookie === "function") {
                global.MCQTracker.refreshCookie();
            }
        } else {
            deleteCookie("ks_mcq_progress");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
