/**
 * Class for handling historization
 * Uses cookies for storing the last accessed URL for document.referrer is unreliable at best
 * This stuff can also deal with double refreshing occuring in certain scenarios
 *
 * Created by Petr Bludsky
 */

var Historization = function () {
}

Historization.prototype = {
    locked: false,
    lastUrl: "",

    lock: function () {
        this.locked = true;
    },

    unlock: function () {
        this.locked = false;
    },

    isUnlocked: function () {
        return !this.locked;
    },

    isReloadable: function(){
        var state = History.getState();
        return this.lastUrl === getCookie("currentUrl") && this.isUnlocked() && state.title;
    },

    storeUrl: function () {
        var currentUrl = window.location.href.split('?')[0];
        this.lastUrl = getCookie("currentUrl");
        document.cookie = "currentUrl=" + currentUrl + ";path=/";
    },

    conditionalReload: function () {
        if (this.isReloadable()) {
            window.location.reload();
        }
    },

//historizationWithRequiredURLParameters
    pushStateWithParameters: function (tableId, url, state) {
        this.lock();
        $('#' + tableId + '_settings').val(url);

        if ($.browser.msie && ($.browser.version * 1) < 10) {
            // for MSIE 8 and 9 push only query string
            History.pushState(null, state, decodeURI(url));
        }
        else {
            if (typeof url !== "undefined") {
                var urlState = window.location.origin + window.location.pathname + url;
            }
            History.pushState("", state, urlState);
        }
        this.unlock();
        this.storeUrl();
    }

};

var historization = new Historization();

// Store the current url into cookie
historization.storeUrl();