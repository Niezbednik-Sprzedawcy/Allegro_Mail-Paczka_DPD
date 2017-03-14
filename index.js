var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var self = require("sdk/self");

var button = buttons.ActionButton({
  id: "run",
  label: "Utwórz zlecenie DPD z maila od Allegro",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png",
  },
  onClick: handleClick
});

var { getTabForId, getTabContentWindow } = require ("sdk/tabs/utils");
var tab = tabs.activeTab;
var window = getTabContentWindow (getTabForId(tab.id));

function handleClick(state) {

    function getMatches(string, regex, index) {
        index || (index = 1);
        var matches = [];
        var match;
        while (match = regex.exec(string)) {
            matches.push(match[index]);
        }
        return matches;
    }

    function get_regex_results(text, re) {
        var substrings = [];
        var result = re.exec(text);
        while (result != null) {
            substrings.push([RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5,  RegExp.$6]);
            result = re.exec(text);
        }
        return substrings;
    }

    function fill_form(content) {
        var payment = false;
        if (content.indexOf('zapłacił Ci za zakupy przez PayU.') > -1) {
            var address = get_regex_results(content, /\n(.+(?:\<br>\t?))?(.+)\<br>\n(.+)\<br>\n(\d\d-\d\d\d)(.+)\t?\<br>/g);
            if (address.length > 0) {
                address[0][0] = address[0][0].replace("<br>","");
                var phone_number = get_regex_results(content, /Numer telefonu\<\/strong><\/td>\n.*">(.*)<\/td>/g);
                var email = get_regex_results(content, /Płacący.*\n.*>(.*)\<\/a><\/td>/g);
                var contents = get_regex_results(content, /<strong>Transakcja<\/strong>.*\n.*\n<a[^>]+>([^<]+)<\/a>/g);
            } else {
                window.alert('Brak adresów wysyłkowych na stronie.\nOtwórz wiadomość allegro z informacją o wyborze sposobu zapłaty i dostawy przez Kupującego lub wpłacie.');
                return;
            }
        } else if (content.indexOf('wybrał sposób zapłaty i dostawy') > -1) {
            var address = get_regex_results(content, /\n([^<]+(?:\<br>))?([^<]+)<br>([^<]+)<br>\n(\d\d-\d\d\d)([^<]+)<br>/g);
            if (address.length > 0) {
                address[0][0] = address[0][0].replace("<br>","");
                var phone_number = get_regex_results(content, /Telefon <span>\n(?:<a[^>]+>)?([^<]+)(?:<\/a>)? <\/span>/g);
                if (content.indexOf('<b>podstawowy widok HTML</b>') > -1) {
                    var email = get_regex_results(content, /Adres zwrotny\: ([^<]+)/gi);
                } else {
                    email = "";
                }
                var contents = get_regex_results(content, /<strong>Transakcja<\/strong>\n.*\n.*\n<a[^>]+>([^<]+)<\/a>/g);
                if (content.indexOf('Przesyłka kurierska pobraniowa') > -1) {
                    var payment = get_regex_results(content, /<strong>Do zapłaty<\/strong>\n<\/td>\n<td>\n(.+) zł <\/td>/g);
                }
            } else {
                window.alert('Brak adresów wysyłkowych na stronie.\nOtwórz wiadomość allegro z informacją o wyborze sposobu zapłaty i dostawy przez Kupującego lub wpłacie.');
                return;
            }
        } else {
            if (content.indexOf('Gratulacje! Sprzedałeś przedmiot w sklepie') > -1) {
                window.alert('W mailu informującym o sprzedaży podany adres może się różnić od adresu do wysyłki. Proszę otwórz mail o wyborze sposobu zapłaty przez Klienta lub wpłacie.');
            } else {
                window.alert('Otwórz wiadomość allegro z informacją o wyborze sposobu zapłaty i dostawy przez Kupującego lub wpłacie.');
            }
            return;
        }
        if (address.length > 1) {
            window.alert('Na stronie znaleziono kilka wiadomości z adresami wysyłkowymi.\nZlecenie zostanie wygenerowane z pierwszego adresu.');
        }
        tabs.open({
            url: "https://online.dpd.com.pl/packages.do",
            onOpen: function onOpen(tab) {

            },
            onReady: function onReady(tab) {
                if (tab.opened) {
                    tab.opened +=1;
                } else {
                    tab.opened = 1;
                }
                if (tab.opened == 1) {
                    var worker = tab.attach({
                        contentScriptFile: self.data.url("jquery.min.js"),
                        contentScript: "$('input[value=\"Nowa\"]').click();",
                    });
                }
            },
            onLoad: function onLoad(tab) {
                if(tab.url.indexOf("webClient.go") > -1) {
                    if (tab.opened == 2) {
                        var worker = tab.attach({
                            contentScriptFile: [self.data.url("jquery.min.js"), self.data.url("form_filler.js")],
                            contentScriptOptions: {"address" : address, "phone_number":phone_number, "email":email, "contents":contents, "payment":payment}
                        });
                    }
                }
            }
        });
    }

    
    var worker = tabs.activeTab.attach({
        contentScript: "self.postMessage(document.documentElement.innerHTML);",
        onMessage: function(data)
        {
            data = data.replace(/ +(?= )/g,'');
            data = data.replace(/\n /g, '\n');
            data = data.replace(/\t+(?=\t)/g,'');
            data = data.replace(/\n\t/g, '\n');
            fill_form(data);
        }
    });

}