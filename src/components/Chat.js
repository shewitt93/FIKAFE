import React, { Component } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import UserMessage from "./UserMessage";
import { getUser, getChat } from "../Actions/actions";
import { connect } from "react-redux";
import "../styles/Userchat.css";
const URL = "wss://fika-chat.herokuapp.com/";

class Chat extends React.Component {
  state = {
    message: [],
  };
  ws = new WebSocket(URL);
  componentDidMount() {
    this.props.getUser();
    // this.props.getChat();
    this.setState({ message: this.props.user.message });
    this.ws.onopen = () => {
      // on connecting, log it to the console
      console.log("A user has connected");
    };
    this.ws.onmessage = (evt) => {
      // on receiving a message, add it to the list of messages
      const message = JSON.parse(evt.data);
      this.addMessage(message);
    };
    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
      this.setState({
        ws: new WebSocket(URL),
      });
    };
  }

  componentDidUpdate(prevProps, PrevState) {
    if (PrevState.message !== this.state.message) {
      // this.setState({ message: this.props.getChat() });
      this.props.getChat();
      this.setChat();
    }
  }
  setChat = () => {
    this.setState({ message: this.props.user.message });
  };
  addMessage = (data) =>
    this.setState((state) => ({ message: [...state.message, data] }));

  submitMessage = (messageString) => {
    // on submitting the ChatInput form, send the message, add it to the list and reset the input
    const message = {
      username: this.props.user.userData.username,
      message: messageString,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `JWT ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(message),
    };

    fetch(
      "https://fika-django.herokuapp.com/core/message/",
      options
    ).then((r) => r.json());
    this.ws.send(JSON.stringify(message));
    this.addMessage(message);
    this.setChat();
  };
  render() {
    const name = this.props.user.userData.username;
    let message = this.props.user.message.map((message, index) =>
      name !== message.username ? (
        <ChatMessage
          className="otherusers"
          key={index}
          message={message.message}
          name={message.username}
          time={message.created_at}
        />
      ) : (
        <UserMessage
          className="currentuser"
          key={index}
          message={message.message}
          name={message.username}
          time={message.created_at}
        />
      )
    );
    return (
      <div>
        <div className="yellowcircleChat yellowcircle"></div>
        <div className="greencircle"></div>
        <div className="chatWrapper wrapper">
          <div className="chatbox">{message}</div>

          <ChatInput
            ws={this.ws}
            onSubmitMessage={(messageString) =>
              this.submitMessage(messageString)
            }
          />
        </div>
      </div>
    );
  }
}
const mSTP = (state) => ({ user: state });
export default connect(mSTP, { getUser, getChat })(Chat);
// export default Chat;
