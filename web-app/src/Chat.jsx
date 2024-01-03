import { Container, Divider, FormControl, Grid, IconButton, List, ListItem, ListItemText, Paper, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { Fragment, useEffect, useRef, useState, useContext } from "react";
import './Chat.css';
import SendIcon from '@mui/icons-material/Send';
import { InputAdornment } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import AndroidIcon from '@mui/icons-material/Android';
import LinearProgress from '@mui/material/LinearProgress';
import { CHAT_WS, CHAT_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import { PropaneSharp } from "@mui/icons-material";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PyPalIcon } from './Icons';

function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

function stringAvatar(name, picture) {

    if (!name) {
        name = "Anonymous User";
    }

    if (!name.includes('\s')) {
        name += "User";
    }

    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
        src: picture
    };
}

class Message {
    constructor(role, content) {
        this.role = role;
        this.content = content;
    }
}

class Chat extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.ENTER_KEY_CODE = 13;
        this.scrollBottomRef = React.createRef();
        this.state = {
            chatMessages: [
                new Message('assistant', "Hi, I'm PyPal, your Python programming buddy! If you have any questions about the programming problem below, feel free to ask me."),
                new Message('problem', this.props.description + '')
            ],
            chatSummary: '',
            chatSummaryMessages: [],
            user: '',
            message: '',
            loading: false,
            userCodeGetter: props.userCode
        };
        //this.openWebSockets.bind(this);
    }

    handleMessageChange = (event) => {
        this.setState({ message: event.target.value });
    }

    /*openWebSockets = () => {
        let self = this;
        self.ws = new WebSocket(CHAT_WS + '?idToken=' + this.context.jwtToken);

        self.ws.onopen = function () {
            console.log('ws opened');
        };

        self.ws.onclose = function () {
            console.log('ws closed');
            self.openWebSockets();
        };

        self.ws.onerror = function () {

            console.log('ws error');
            self.ws.close();
        };
    }*/

    handleEnterKey = (event) => {
        if (event.shiftKey && event.keyCode === this.ENTER_KEY_CODE) {
            console.log('shift + enter');
            return;
        } else if (event.keyCode === this.ENTER_KEY_CODE) {
            console.log('enter');

            if (event.key === "Enter") {
                event.preventDefault();
            }

            this.sendMessage();
        }
    }

    componentDidMount() {
        console.log('component did mount invoked', this.context);

        /*if (this.scrollBottomRef.current) {
            this.scrollBottomRef.current.scrollIntoView({ behaviour: "smooth" });
        }*/

        //this.openWebSockets();

        // Set state.message to props.input if it exists
        if (this.props.input) {
            this.setState({ message: this.props.input });
        }
    }

    componentWillUnmount() {
        //this.ws.close();
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.input !== prevProps.input) {
            this.setState({ message: this.props.input });
        }
    }

    sendMessage = () => {

        if (!this.state.loading && this.state.message) {

            this.setState({
                chatMessages: [...this.state.chatMessages, new Message('user', this.state.message)],
                loading: true,
                message: ''
            });

            setTimeout(() => {
                if (self.scrollBottomRef.current) {
                    self.scrollBottomRef.current.scrollIntoView({ behaviour: "smooth" });
                }
            }, 200);

            console.log('Send!', this.state.message);

            let messages = [...this.state.chatMessages, new Message('user', this.state.message)];

            let self = this;

            let accumulatedMessage = '';

            this.props.socket.setSubscriber((receivedMessage) => {
                console.log('msg', receivedMessage);

                if (receivedMessage === '<START>' || receivedMessage.includes('Endpoint request timed out')) {
                    // skip
                } else if (receivedMessage === '<FINISH>') {
                    self.setState({ loading: false });
                } else if (receivedMessage.startsWith('<HISTORY>')) {
                    const history = JSON.parse(receivedMessage.replace('<HISTORY>', '').replace('</HISTORY>', ''))
                    self.setState({chatSummary: history['summary'], chatSummaryMessages: history['messages']});
                } else {
                    accumulatedMessage += receivedMessage;

                    self.setState({
                        chatMessages: [...messages, new Message('assistant', accumulatedMessage)],
                    });
                }

                if (self.scrollBottomRef.current) {
                    self.scrollBottomRef.current.scrollIntoView({ behaviour: "smooth" });
                }
            });

            /*this.ws.onmessage = function (evt) {
                var receivedMessage = evt.data;

                console.log('msg', receivedMessage);

                if (receivedMessage === '<START>' || receivedMessage.includes('Endpoint request timed out')) {
                    // skip
                } else if (receivedMessage === '<FINISH>') {
                    self.setState({ loading: false });
                } else {
                    accumulatedMessage += receivedMessage;

                    self.setState({
                        chatMessages: [...messages, new Message('assistant', accumulatedMessage)],
                    });
                }

                if (self.scrollBottomRef.current) {
                    self.scrollBottomRef.current.scrollIntoView({ behaviour: "smooth" });
                }
            };*/

            let message = JSON.stringify({
                "userFullName": this.context.payload.name,
                "action": "sendmessage",
                "challengeId": this.props.challenge,
                //"context": this.state.chatMessages,
                "summary": this.state.chatSummary,
                "messages": this.state.chatSummaryMessages,
                "prompt": this.state.message,
                "userCode": this.state.userCodeGetter()
            });
            //this.ws.send(message);
            this.props.socket.send(message);
        }
    };

    render() {
        const listChatMessages = this.state.chatMessages.map((message, index) =>
            <Paper className={'comment-wrapper ' + message.role} key={index} elevation={1} style={{ padding: 8, marginTop: 8, marginLeft: 1, marginRight: 1 }}>
                <div className='comment'>
                    {
                        message.role !== 'problem' ? (<div className="comment-avatar">
                            {message.role === 'user' ? <Avatar {...stringAvatar(this.context.payload.name, this.context.payload.picture)} /> : <Avatar><PyPalIcon /></Avatar>}
                        </div>) : null
                    }

                    <div className="comment-content">
                        <ReactMarkdown components={{
                            //code: Paper
                        }} children={message.content}></ReactMarkdown>
                    </div>
                </div>
            </Paper>
        );

        return (
            <div id="chat">
                <Container style={{ padding: 0 }}>
                    <Paper elevation={5} style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                        <Box p={3} display="flex" flexDirection="column">
                            <Grid container spacing={0} alignItems="center">
                                <Grid id="chat-window2" xs={12} item>
                                    <List id="chat-window-messages">
                                        {listChatMessages}
                                        <ListItem ref={this.scrollBottomRef}></ListItem>
                                    </List>
                                </Grid>
                                <Grid xs={12} item>
                                    <FormControl fullWidth>
                                        <TextField
                                            onChange={this.handleMessageChange}
                                            onKeyDown={this.handleEnterKey}
                                            value={this.state.message}
                                            label="Message PyPal"
                                            placeholder=""
                                            multiline
                                            InputProps={{
                                                endAdornment:
                                                    <InputAdornment position="end" classes={{ root: { alignItems: 'flex-end' } }}>
                                                        <IconButton disabled={this.state.loading} onClick={this.sendMessage} aria-label="send" color="primary"><SendIcon /></IconButton>
                                                    </InputAdornment>,
                                            }}
                                            variant="outlined" />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>

                    {this.state.loading && <LinearProgress />}
                </Container>
            </div>
        );
    }
}

export default Chat;