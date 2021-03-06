/* global  Handlebars, pubsub, io, _ */

"use strict";
// does the heavy lifting for client <-> server communication
((global) => {
    const socket = io.connect("http://localhost:8000/piata");
    socket.on("connect", () => console.log("socket server connection established"));
    // handles load request
    let loadAcct = (topics, acct) => {
        console.log("emitting validate request for acct", acct);
        socket.emit("validate", acct);
    }
    pubsub.subscribe("load acct", loadAcct);
    // configures acct data for consumption
    let returnObject = (acct, valid, json) => {
        let acctObj = {};
        if (acct && valid) {
            acctObj.acct = acct;
            acctObj.valid = true;
            acctObj.info = json;
        } else {
            acctObj.acct = acct ? acct : null;
            acctObj.valid = false;
            acctObj.info = null;
        }
        pubsub.publish("return acct", acctObj);
    }
    ////* listen for data events *////
    socket.on("validate fail", (acct) => {
        returnObject(acct, false, null);
    })
    socket.on("spawn error", (data) => {
        console.log("child process closed with code: ", data.code);
        returnObject(data.acct, true, null);
    })
    socket.on("JSON error", (data) => {
        console.log("could not parse data returned from python: ", data);
        returnObject(false, true, null);
    })
    socket.on("return acct", (json) => {
        returnObject(json.acct, true, json);
    })
    ////* listen for state events *////
    socket.on("spawning", (acct) => {
        pubsub.publish("_acct handled", {
            event: "found",
            acct: acct
        });
    })
})(window);