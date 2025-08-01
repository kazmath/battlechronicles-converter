// ==UserScript==
// @name         Import from Battle Chronicle
// @namespace    https://github.com/kazmath/
// @updateURL    https://github.com/kazmath/battlechronicle-importer/raw/main/bc_importer.user.js
// @downloadURL  https://github.com/kazmath/battlechronicle-importer/raw/main/bc_importer.user.js
// @version      1.1
// @description  A script to import the characters, weapons and artifacts visible from battle chronicle and copy to the clipboard. For joint usage with https://kazmath.github.io/battlechronicle-importer/.
// @author       KazMath
// @match        https://act.hoyolab.com/*
// @icon         https://www.google.com/s2/favicons?domain=https://act.hoyolab.com/app/community-game-records-sea/index.html
// @grant        none
// @run-at       context-menu
// ==/UserScript==

"use strict";

function main() {
    const uid = document
        .querySelectorAll("p.uid")[0]
        .innerText.replace(/UID/, "");

    let server = "";
    if (uid.startsWith("1") || uid.startsWith("2") || uid.startsWith("3")) {
        throw new Error("Chinese servers not supported");
    }

    if (uid.startsWith("5")) {
        throw new Error("Chinese servers not supported");
    }

    if (uid.startsWith("6")) {
        server = "os_usa";
    }

    if (uid.startsWith("7")) {
        server = "os_euro";
    }

    if (uid.startsWith("8") || uid.startsWith("18")) {
        throw new Error(
            "Region unsupported as of now. Please open an issue if you are from this region and want to help."
        );
    }

    if (uid.startsWith("9")) {
        throw new Error(
            "Region unsupported as of now. Please open an issue if you are from this region and want to help."
        );
    }

    const lastRequestDate = localStorage.getItem(
        "__bc-to-good_userscript_ratelimit__"
    );
    if (
        lastRequestDate != null &&
        Number.isFinite(+lastRequestDate) &&
        Date.now() - +lastRequestDate <= 30 * 1000
    ) {
        // 30s rate limiter (do not remove unless you want to potentially be banned)
        throw new Error(
            "Rate limited, wait 30s before executing this action again."
        );
    }

    fetch(
        "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list",
        {
            method: "POST",
            body: JSON.stringify({
                server: server,
                role_id: uid,
            }),
            headers: {
                Accept: "application/json",
                "x-rpc-language": "en-us",
                "x-rpc-lang": "en-us",
            },
            credentials: "include",
            referrer: "https://act.hoyolab.com/",
        }
    )
        .then((e) => e.json())
        .then((e) => {
            const id_list = e.data.list.map((value) => {
                return value.id;
            });

            return fetch(
                "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail",
                {
                    method: "POST",
                    body: JSON.stringify({
                        server: server,
                        role_id: uid,
                        character_ids: id_list,
                    }),
                    headers: {
                        Accept: "application/json",
                        "x-rpc-language": "en-us",
                        "x-rpc-lang": "en-us",
                    },
                    credentials: "include",
                    referrer: "https://act.hoyolab.com/",
                }
            );
        })
        .then((e) => e.json())
        .then((e) => {
            localStorage.setItem(
                "__bc-to-good_userscript_ratelimit__",
                Date.now()
            );
            setTimeout(() => {
                localStorage.removeItem("__bc-to-good_userscript_ratelimit__");
                console.log("30s passed, no longer rate limited");
            }, 30 * 1000);
            navigator.clipboard
                .writeText(JSON.stringify(e))
                .then((_) => alert("Output copied to clipboard"))
                .catch((_) => {
                    alert(
                        "Failed to copy to clipboard. Download the file provided to receive output."
                    );
                    saveFile("bc_export.json", JSON.stringify(e));
                });
        })
        .catch((e) => {
            throw new Error(e);
        });
}

function saveFile(filename, data) {
    const blob = new Blob([data], {
        type: "application/json",
    });
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

try {
    main();
} catch (error) {
    alert(error);
}
