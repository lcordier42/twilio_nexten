const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
// const Twilio = require("twilio").Twilio;

const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;

const client = new twilio.Twilio(accountSid, authToken);
const service = client.chat.services(config.twilio.chatServiceSid);
const app = new express();

app.use(bodyParser.json());

app.post("/token/:identity/:status", (request, response) => {
    const identity = request.params.identity;
    var permission = "RL0dad3491bb6349a5a53458a0fc97843c"; // service user
    if (
        request.params.status === "business" ||
        request.params.status === "coach"
    )
        permission = "RL3d68dbcbf8ec4c018d36d578330309c0"; // admin user
    const accessToken = new AccessToken(
        config.twilio.accountSid,
        config.twilio.apiKey,
        config.twilio.apiSecret,
    );
    const chatGrant = new ChatGrant({
        serviceSid: config.twilio.chatServiceSid,
        endpointId: `${identity}:browser`,
    });
    accessToken.addGrant(chatGrant);
    accessToken.identity = identity;

    response.set("Content-Type", "application/json");
    response.send(
        JSON.stringify({
            token: accessToken.toJwt(),
            identity: identity,
        }),
    );
    service
        .users(identity)
        .update({
            roleSid: permission,
        })
        .then(function(response) {
            console.log(response);
        })
        .catch(function(error) {
            if (error.code === 20404) {
                service.users
                    .create({
                        identity: identity,
                        roleSid: permission,
                    })
                    .then(function(response) {
                        console.log(response);
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            } else console.log(error);
        });
});

app.listen(config.port, () => {
    console.log(`Application started at localhost:${config.port}`);
});
