import React from 'react'
import { CHAT_WS, CODE_URL } from './Urls';

export const WebSocketContext = React.createContext(false, null, () => {}); //ready, value, send

class SubscriptionManager {

  constructor(ws) {
    this.ws = ws;
    this.subscribers = [];
    // Temporary
    this.subscriber = null;
    this.ready = false;
  }

  setReady(ready) {
    this.ready = ready;
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber);
  }

  unsubscribe(subscriber) {
    this.subscribers.splice(this.subscribers.indexOf(subscriber),1)
  }

  setSubscriber(subscriber) {
    this.subscriber = subscriber;
  }

  broadcast(message) {
    this.subscribers.forEach(subscriber => subscriber(message));

    if (this.subscriber != null) {
      this.subscriber(message);
    }
  }

  send(message) {
    this.ws.send(message);
  }

  isReady() {
    return this.ready;
  }

  setWs(ws) {
    this.ws = ws;
  }

}

const wsManager = new SubscriptionManager();

// Make sure to put WebsocketProvider higher up in
// the component tree than any consumers.
export const WebSocketProvider = (props) => {

  //const [isReady, setIsReady] = React.useState(false);
  //const [val, setVal] = React.useState(null);

  //const ws = React.useRef(null);

  function connect() {
    let socket = new WebSocket(props.url);

    socket.onopen = () => {
      wsManager.setReady(true);
    }
    socket.onclose = (e) => {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
      wsManager.setReady(false);

      setTimeout(function() {
        connect();
      }, 1000);
    }
    socket.onerror = (err) => {
      console.error('Socket encountered error: ', err.message, 'Closing socket');
      socket.close();
    }
    socket.onmessage = (event) => wsManager.broadcast(event.data);

    //ws.current = socket;

    wsManager.setWs(socket);
  }

  connect();

  return (
    <WebSocketContext.Provider value={wsManager}>
      {props.children}
    </WebSocketContext.Provider>
  );
};