import React, { Component } from "react";
import NameBox from "./NameBox.js";
import Chat from "twilio-chat";

class ChatApp extends Component {
    constructor(props) {
        super(props);
        const name = sessionStorage.getItem("name") || "";
        const status = sessionStorage.getItem("status") || "";
        const loggedIn = name !== "";
        this.state = {
            name,
            status,
            loggedIn,
            token: "",
            chatReady: false,
            messages: [],
            newMessage: "",
            channels: [],
            newChannel: "",
            inviteUser: "",
            delChannel: "",
        };
        this.channelName = sessionStorage.getItem("channelName") || "general";
        this.invitedChannel = sessionStorage.getItem("invitedChannel") || "";
    }

    componentWillMount = () => {
        if (this.state.loggedIn) {
            this.getToken();
        }
    };

    onNameChanged = (event) => {
        this.setState({ name: event.target.value });
    };

    onStatusChanged = (event) => {
        this.setState({ status: event.target.value });
    };

    logIn = (event) => {
        event.preventDefault();
        if (this.state.name !== "") {
            sessionStorage.setItem("name", this.state.name);
            sessionStorage.setItem("status", this.state.status);
            this.setState({ loggedIn: true }, this.getToken);
        }
    };

    logOut = (event) => {
        event.preventDefault();
        this.setState({
            name: "",
            status: "",
            loggedIn: false,
            token: "",
            chatReady: false,
            messages: [],
            newMessage: "",
            newChannel: "",
            inviteUser: "",
            delChannel: "",
        });
        sessionStorage.removeItem("name");
        sessionStorage.removeItem("status");
        sessionStorage.setItem("channelName", "general");
        this.channelName = "general";
        this.chatClient.shutdown();
        this.channel = null;
    };

    getToken = () => {
        fetch(`/token/${this.state.name}/${this.state.status}`, {
            method: "POST",
        })
            .then((response) => response.json())
            .then((data) => {
                this.setState({ token: data.token }, this.initChat);
            });
    };

    initChat = () => {
        this.chatClient = new Chat(this.state.token);
        this.chatClient.initialize().then(this.clientInitiated.bind(this));
    };

    clientInitiated = () => {
        this.channelList = [];
        this.setState({ chatReady: true }, () => {
            this.chatClient
                .getChannelByUniqueName(this.channelName)
                .then((channel) => {
                    if (channel) {
                        return (this.channel = channel);
                    }
                })
                .catch((err) => {
                    if (err.body.code === 50300) {
                        return this.chatClient.createChannel({
                            uniqueName: this.channelName,
                        });
                    }
                })
                .then((channel) => {
                    this.channel = channel;
                    window.channel = channel;
                    return this.channel.join();
                })
                .then(() => {
                    this.channel.getMessages().then(this.messagesLoaded);
                    this.channel.on("messageAdded", this.messageAdded);
                });
            this.chatClient.on("channelInvited", function(channel) {
                console.log("Invited to channel " + channel.uniqueName);
                this.channel = channel;
                sessionStorage.setItem("invitedChannel", channel.uniqueName);
            });
            this.chatClient
                .getUserChannelDescriptors()
                .then(this.channelAdded.bind(this))
                .then(this.channelLoaded.bind(this));
        });
    };

    channelAdded = (paginator) => {
        var i;
        var channel = [];

        for (i = 0; i < paginator.items.length; i++) {
            channel[i] = paginator.items[i].uniqueName;
        }
        this.setState({ channels: channel });
        console.log(this.state.channels);
    };

    channelLoaded = () => {
        var i;

        console.log("hello");
        for (i = 0; i < this.state.channels.length; i++) {
            console.log(this.state.channels[i]);
            this.channelList.push(
                <button
                    type="submit"
                    key={i}
                    onClick={this.onChannelChanged}
                    value={this.state.channels[i]}
                >
                    {this.state.channels[i]}
                </button>,
            );
        }
    };

    messagesLoaded = (messagePage) => {
        this.setState({ messages: messagePage.items });
    };

    messageAdded = (message) => {
        this.setState((prevState, props) => ({
            messages: [...prevState.messages, message],
        }));
    };

    onMessageChanged = (event) => {
        this.setState({ newMessage: event.target.value });
    };

    onChannelChanged = (event) => {
        this.setState({ newChannel: event.target.value });
    };

    onDelChannelChanged = (event) => {
        this.setState({ delChannel: event.target.value });
    };

    onInviteChanged = (event) => {
        this.setState({ inviteUser: event.target.value });
    };

    sendMessage = (event) => {
        event.preventDefault();
        const message = this.state.newMessage;
        this.setState({ newMessage: "" });
        this.channel.sendMessage(message);
    };

    newMessageAdded = (li) => {
        if (li) {
            li.scrollIntoView();
        }
    };

    createNewChannel = (event) => {
        event.preventDefault();
        this.channelList = [];
        if (this.invitedChannel) {
            this.channelName = this.invitedChannel;
            this.invitedChannel = "";
            sessionStorage.setItem("invitedChannel", "");
        } else this.channelName = this.state.newChannel;
        this.setState({ newChannel: "" });
        this.setState({ chatReady: true }, () => {
            this.chatClient
                .getChannelByUniqueName(this.channelName)
                .then((channel) => {
                    if (channel) {
                        console.log("heho");
                        return (this.channel = channel);
                    }
                })
                .catch((err) => {
                    if (err.body.code === 50300) {
                        return this.chatClient.createChannel({
                            uniqueName: this.channelName,
                        });
                    }
                })
                .then((channel) => {
                    channel.add(this.state.name);
                });
            this.chatClient
                .getUserChannelDescriptors()
                .then(this.channelAdded.bind(this))
                .then(this.channelLoaded.bind(this));
        });
    };

    deleteChannel = (event) => {
        event.preventDefault();
        this.channelName = this.state.delChannel;
        this.setState({ delChannel: "" });
        this.chatClient
            .getChannelByUniqueName(this.channelName)
            .then((channel) => {
                channel.delete();
            });
        this.chatClient
            .getUserChannelDescriptors()
            .then(this.channelAdded.bind(this))
            .then(this.channelLoaded.bind(this));
    };

    inviteChannel = (event) => {
        event.preventDefault();
        const user = this.state.inviteUser;
        this.setState({ inviteUser: "" });
        this.channel
            .invite(user)
            .catch((err) => {
                if (err.code === 50200) {
                    console.log("This user doesn't exist.");
                }
            })
            .then(function() {
                console.log("Your friend " + user + " has been invited!");
            });
    };

    joinChannel = (event) => {
        event.preventDefault();
        this.channelName = this.state.newChannel;
        this.setState({ newChannel: "" });
        this.setState({ chatReady: true }, () => {
            this.chatClient
                .getChannelByUniqueName(this.channelName)
                .then((channel) => {
                    if (channel) {
                        return (this.channel = channel);
                    }
                })
                .catch((err) => {
                    if (err.code === 50300) {
                        console.log("This channel doesn't exist");
                    }
                })
                .then((channel) => {
                    this.channel = channel;
                    window.channel = channel;
                    sessionStorage.setItem("channelName", this.channelName);
                    return this.channel.join();
                })
                .then(() => {
                    this.channel.getMessages().then(this.messagesLoaded);
                    this.channel.on("messageAdded", this.messageAdded);
                });
            this.chatClient
                .getUserChannelDescriptors()
                .then(this.channelLoaded.bind(this));
        });
    };

    render() {
        var loginOrChat;
        var adminOrNot;

        const messages = this.state.messages.map((message) => {
            return (
                <li key={message.sid} ref={this.newMessageAdded}>
                    <b>{message.author}:</b> {message.body}
                </li>
            );
        });
        if (
            this.state.loggedIn &&
            (this.state.status === "business" || this.state.status === "coach")
        ) {
            adminOrNot = (
                <div>
                    <form onSubmit={this.createNewChannel}>
                        <input
                            type="text"
                            name="newchannel"
                            id="newchannel"
                            onChange={this.onChannelChanged}
                            value={this.state.newChannel}
                        />
                        <button>create</button>
                    </form>
                    <form onSubmit={this.deleteChannel}>
                        <input
                            type="text"
                            name="delchannel"
                            id="delchannel"
                            onChange={this.onDelChannelChanged}
                            value={this.state.delChannel}
                        />
                        <button>delete</button>
                    </form>
                    <form onSubmit={this.inviteChannel}>
                        <input
                            type="text"
                            name="inviteuser"
                            id="inviteuser"
                            onChange={this.onInviteChanged}
                            value={this.state.inviteUser}
                        />
                        <button>invite</button>
                    </form>
                </div>
            );
        } else {
            adminOrNot = null;
        }
        if (this.state.loggedIn) {
            loginOrChat = (
                <div>
                    <h3>Messages</h3>
                    <p>Logged in as {this.state.name}</p>
                    <ul className="messages">{messages}</ul>
                    <form onSubmit={this.sendMessage}>
                        <label htmlFor="message">Message: </label>
                        <input
                            type="text"
                            name="message"
                            id="message"
                            onChange={this.onMessageChanged}
                            value={this.state.newMessage}
                        />
                        <button>Send</button>
                    </form>
                    <br />
                    <br />
                    <form onSubmit={this.joinChannel}>{this.channelList}</form>
                    <br />
                    <br />
                    <form onSubmit={this.logOut}>
                        <button>Log out</button>
                    </form>
                </div>
            );
        } else {
            loginOrChat = (
                <div>
                    <NameBox
                        name={this.state.name}
                        onNameChanged={this.onNameChanged}
                        status={this.state.status}
                        onStatusChanged={this.onStatusChanged}
                        logIn={this.logIn}
                    />
                </div>
            );
        }
        return (
            <div>
                <div>{loginOrChat}</div>
                <div>{adminOrNot}</div>
            </div>
        );
    }
}

export default ChatApp;
