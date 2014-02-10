(function(f, define){
    define([ "./kendo.core" ], f);
})(function(){

var __meta__ = {
    id: "maskinput",
    name: "MaskInput",
    category: "web",
    description: "The MaskInput widget allows to specify a mask type on an input field.",
    depends: [ "core" ]
};

(function($, undefined) {
    var kendo = window.kendo;
    var keys = kendo.keys;
    var ui = kendo.ui;
    var Widget = ui.Widget;
    var ns = ".kendoNumericTextBox";

    var MaskInput = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            element = that.element;

            that._tokenize();

            that.element
                .addClass("k-textbox")
                .attr("autocomplete", "off")
                .on("paste" + ns, $.proxy(that._paste, that))
                .on("keydown" + ns, $.proxy(that._keydown, that))
                .on("keypress" + ns, $.proxy(that._keypress, that))
                .on("focus" + ns, function() {
                    if (!element.val()) {
                        element.val(that._emptyMask);
                        caret(element[0], 0);
                    } else {
                        element.select();
                    }
                })
                .on("blur" + ns, function() {
                    if (element.val() === that._emptyMask) {
                        element.val("");
                    }
                });

            this.value(that.options.value);
        },

        options: {
            name: "MaskInput",
            emptySymbol: "_",
            mask: ""
        },

        events: [],

        rules: {
            "0": /\d/
        },

        value: function(value) {
            if (value === undefined) {
                return this.element.val();
            }

            value = this._unmask(value);

            this._mask(0, this._maskLength, value);
        },

        _paste: function(e) {
            var that = this;
            var element = e.target;
            var position = caret(element);
            var start = position[0];
            var end = position[1];

            if (start !== end) {
                that._mask(start, end, "");
                start = caret(element)[0];
            }

            setTimeout(function() {
                var value = element.value;
                var end = caret(element)[0];
                var pasted = value.substring(start, end);

                element.value = value.substring(0, start) + value.substring(end);
                caret(element, start);

                that._mask(start, start, pasted);
            });
        },

        _keydown: function(e) {
            var key = e.keyCode;
            var selection = caret(this.element[0]);
            var start = selection[0];
            var end = selection[1];
            var placeholder;

            if (key == keys.BACKSPACE) {
                if (start === end) {
                    start = start - 1;
                    placeholder = this._find(start, -1);

                    if (placeholder !== start) {
                        caret(this.element[0], placeholder + 1);
                    }
                }

                if (placeholder !== undefined && placeholder !== start) {
                    caret(this.element[0], placeholder + 1);
                } else if (start > -1) {
                    this._mask(start, end, "", true);
                }

                e.preventDefault();
            } else if (key == keys.DELETE) {
                if (start === end) {
                    end += 1;

                    placeholder = this._find(start);

                    if (placeholder !== start) {
                        caret(this.element[0], placeholder);
                        e.preventDefault();
                        return;
                    }
                }

                this._mask(start, end, "");

                e.preventDefault();
            }
        },

        _keypress: function(e) {
            var selection = caret(this.element[0]);
            var start = selection[0];
            var end = selection[1];

            this._mask(start, end, String.fromCharCode(e.which));

            e.preventDefault();
        },

        _mask: function(start, end, value, backward) {
            var element = this.element;
            var current = element.val() || this._emptyMask;

            var idx;
            var char;
            var unmasked;
            var charIdx = 0;
            var valueLength;
            var empty = this.options.emptySymbol;

            start = this._find(start, backward ? -1 : 1);

            if (start > end) {
                end = start;
            }

            unmasked = this._unmask(current.substring(end), end);
            value = this._unmask(value);

            valueLength = value.length;

            if (value) {
                unmasked = unmasked.replace(new RegExp("^_{0," + valueLength + "}"), "");
            }

            value += unmasked;
            current = current.split("");
            char = value.charAt(charIdx);

            while (start < this._maskLength) {
                current[start] = char || empty;
                char = value.charAt(++charIdx);

                if (idx === undefined && charIdx > valueLength) {
                    idx = start;
                }

                start = this._find(start + 1);
            }

            element.val(current.join(""));

            if (kendo._activeElement() === element[0]) {
                caret(element[0], idx);
            }
        },

        _find: function(idx, step) {
            var value = this.element.val() || this._emptyMask;

            step = step || 1;

            while (idx > -1 || idx <= this._maskLength) {
                if (value.charAt(idx) !== this.tokens[idx]) {
                    return idx;
                }

                idx += step;
            }

            return -1;
        },

        _unmask: function(value, idx) {
            if (!value) {
                return "";
            }

            value = (value + "").split("");

            var result = "";

            var charIdx = 0;
            var tokenIdx = idx || 0;

            var tokensLength = this.tokens.length;
            var valueLength = value.length;

            var char;
            var token;

            while (tokenIdx < tokensLength) { // || charIdx < valueLength) {
                char = value[charIdx];
                token = this.tokens[tokenIdx];

                if (char === token) { //char is equal to static token. move forward
                    charIdx += 1;
                    tokenIdx += 1;
                } else if (char === this.options.emptySymbol) { //char is empty
                    result += this.options.emptySymbol;

                    charIdx += 1;
                    tokenIdx += 1;
                } else if (typeof token !== "string") { //token is rule

                    if (token.test(char)) { //check if valid
                        result += char;

                        tokenIdx += 1;
                    }

                    charIdx += 1;
                } else { //token is static string
                    tokenIdx += 1;
                }

                if (charIdx >= valueLength) { //test this
                    break;
                }
            }

            return result;
        },

        _tokenize: function() {
            var tokens = [];

            var maskChars = this.options.mask.split("");
            var length = maskChars.length;
            var idx = 0;
            var char;
            var rule;

            var emptyMask = "";
            var emptySymbol = this.options.emptySymbol;

            for (; idx < length; idx++) {
                char = maskChars[idx]
                rule = this.rules[char];

                if (rule) {
                    tokens[idx] = rule;
                    emptyMask += emptySymbol;
                } else {
                    tokens[idx] = char;
                    emptyMask += char;
                }
            }

            this.tokens = tokens;

            this._emptyMask = emptyMask;
            this._maskLength = emptyMask.length;
        }
    });

    function caret(element, position) {
        var range,
            isPosition = position !== undefined;

        if (element.selectionStart !== undefined) {
            if (isPosition) {
                element.focus();
                element.setSelectionRange(position, position);
            } else {
                position = [element.selectionStart, element.selectionEnd];
            }
        } else if (document.selection) {
            if ($(element).is(":visible")) {
                element.focus();
            }
            range = document.selection.createRange();
            if (isPosition) {
                range.move("character", position);
                range.select();
            } else {
                var rangeElement = element.createTextRange(),
                    rangeDuplicated = rangeElement.duplicate(),
                    selectionStart, selectionEnd;

                    rangeElement.moveToBookmark(range.getBookmark());
                    rangeDuplicated.setEndPoint('EndToStart', rangeElement);
                    selectionStart = rangeDuplicated.text.length;
                    selectionEnd = selectionStart + rangeElement.text.length;

                position = [selectionStart, selectionEnd];
            }
        }

        return position;
    }

    ui.plugin(MaskInput);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
