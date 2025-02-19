import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import { Button, Divider, IconButton, Modal, Box } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { useNavigate } from "react-router";

import { db, auth } from "../firebase";
import { addDoc, collection, onSnapshot, orderBy, query, doc, updateDoc, getDoc } from "firebase/firestore";


function UsersComponent({ users, setReceiverData, navigate, currentUserId }) {
  const handleToggle = (username, userId) => {
    setReceiverData({
      username: username,
      userId: userId,
    });

    navigate(`/chat-home/${userId}`);
  };

  return (
    <List dense sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {users?.map((value) => {
        const labelId = `checkbox-list-secondary-label-${value}`;

        if (currentUserId !== value.userId)
          return (
            <ListItem key={value.userId} disablePadding>
              <ListItemButton
                onClick={() => {
                  handleToggle(value.username, value.userId);
                }}
              >
                <ListItemAvatar>
                  <Avatar alt={`${value.username}`} src={`${value.username}.jpg`} />
                </ListItemAvatar>
                <ListItemText id={labelId} primary={`${value.username}`} />
              </ListItemButton>
            </ListItem>
          );
      })}
    </List>
  );
}

function AddFriendModal({ open, handleClose, allUsers, addFriend }) {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ ...style, width: 400 }}>
        <h2>Add Friend</h2>
        <List dense sx={{ width: "100%", bgcolor: "background.paper" }}>
          {allUsers?.map((user) => (
            <ListItem key={user.userId} disablePadding>
              <ListItemButton
                onClick={() => {
                  addFriend(user);
                  handleClose();
                }}
              >
                <ListItemAvatar>
                  <Avatar alt={`${user.username}`} src={`${user.username}.jpg`} />
                </ListItemAvatar>
                <ListItemText primary={`${user.username}`} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receiverData, setReceiverData] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setAllUsers(snapshot.docs.map((doc) => ({ ...doc.data(), userId: doc.id })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setFriends(doc.data().friends || []);
        }
      });
      return unsub;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (receiverData) {
      const unsub = onSnapshot(
        query(
          collection(db, "users", user?.uid, "chatUsers", receiverData?.userId, "messages"),
          orderBy("timestamp")
        ),
        (snapshot) => {
          setAllMessages(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              messages: doc.data(),
            }))
          );
        }
      );
      return unsub;
    }
  }, [receiverData?.userId]);

  const sendMessage = async () => {
    try {
      if (user && receiverData && chatMessage.trim() !== "") {
        const messageData = {
          username: user.displayName,
          messageUserId: user.uid,
          message: chatMessage,
          timestamp: new Date(),
        };

        await addDoc(collection(db, "users", user.uid, "chatUsers", receiverData.userId, "messages"), messageData);
        await addDoc(collection(db, "users", receiverData.userId, "chatUsers", user.uid, "messages"), messageData);

        setChatMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addFriend = async (newFriend) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const updatedFriends = userData.friends || [];

      if (!updatedFriends.some(friend => friend.userId === newFriend.userId)) {
        updatedFriends.push(newFriend);
        await updateDoc(userDocRef, { friends: updatedFriends });
        setFriends(updatedFriends);
      } else {
        console.log("Friend already added");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div style={root}>
      <Paper style={left}>
        <div style={{ display: "flex", padding: 5, justifyContent: "space-between" }}>
          <h4 style={{ margin: 0 }}>{user?.displayName}</h4>
          <Button 
            color="secondary"
            onClick={() => {
              auth.signOut();
              navigate("/");
            }}
          >
            Logout
          </Button>
        </div>
        <Divider />
       Friends
        <div style={{ overflowY: "scroll" }}>
          <UsersComponent users={friends} setReceiverData={setReceiverData} navigate={navigate} currentUserId={user?.uid} />
        </div>
        <Button onClick={handleOpen} style={{ marginTop: 10 }}>
          Add Friend
        </Button>
      </Paper>

      <Paper style={right}>
        <h4 style={{ margin: 2, padding: 10 }}>{receiverData ? receiverData.username : user?.displayName}</h4>
        <Divider />
        <div style={messagesDiv}>
          {allMessages &&
            allMessages.map(({ id, messages }) => (
              <div
                key={id}
                style={{
                  margin: 2,
                  display: "flex",
                  flexDirection: user?.uid === messages.messageUserId ? "row-reverse" : "row",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#BB8FCE",
                    padding: 6,
                    borderTopLeftRadius: user?.uid === messages.messageUserId ? 10 : 0,
                    borderTopRightRadius: user?.uid === messages.messageUserId ? 0 : 10,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    maxWidth: 400,
                    fontSize: 15,
                    textAlign: user?.uid === messages.messageUserId ? "right" : "left",
                  }}
                >
                  {messages.message}
                </span>
              </div>
            ))}
        </div>

        <div style={{ width: "100%", display: "flex", flex: 0.08 }}>
          <input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            style={input}
            type="text"
            placeholder="Type message..."
          />
          <IconButton onClick={sendMessage}>
            <SendIcon style={{ margin: 10 }} />
          </IconButton>
        </div>
      </Paper>

      <AddFriendModal open={open} handleClose={handleClose} allUsers={allUsers} addFriend={addFriend} />
    </div>
  );
}

const root = {
  display: "flex",
  flexDirection: "row",
  flex: 1,
  width: "100%",
};

const left = {
  display: "flex",
  flex: 0.2,
  height: "95vh",
  margin: 10,
  flexDirection: "column",
};

const right = {
  display: "flex",
  flex: 0.8,
  height: "95vh",
  margin: 10,
  flexDirection: "column",
};

const input = {
  flex: 1,
  outline: "none",
  borderRadius: 5,
  border: "none",
};

const messagesDiv = {
  backgroundColor: "#DDD1C7",
  padding: 5,
  display: "flex",
  flexDirection: "column",
  flex: 1,
  maxHeight: 460,
  overflowY: "scroll",
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
