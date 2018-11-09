/** @module src/FCMClient */

import React, { Component } from 'react';
import { NavigationActions } from 'react-navigation';
import FCM, { FCMEvent } from 'react-native-fcm';
import {
  View,
  Modal as RNModal,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { isString } from './common/helpers';
import authService from './auth/authService';
import chatService from './chat/chatService';
import navigationDispatcher from './navigationDispatcher';
import { palette } from './common/styles';
import { Modal } from './common/Modal';

const listeners = new Set();
let handleInitialNotification = true;

/**
 * Component Firebase Cloud Messaging client.
 * @extends Component
 */
class FCMClient extends Component {

  static clearNotification = FCM.removeAllDeliveredNotifications;
  static cancelNotification = FCM.cancelAllLocalNotifications;

  constructor(props) {
    super(props);

    this.state = {
      notification: null
    }
  }

  componentDidMount() {
    authService.onUserChange.add(this.onUserChange);
    console.log("=======Did Mount========");
  }

  componentWillUnmount() {
    authService.onUserChange.delete(this.onUserChange);
  }

  onUserChange = async (isLogged) => {
    await this.requestPermissions();

    if (isLogged) {
      if (handleInitialNotification) this.getInitialNotification();

      if (listeners.size === 0) {
        listeners.add(FCM.on(FCMEvent.RefreshToken, this.onToken));
        listeners.add(FCM.on(FCMEvent.Notification, this.onNotification));
      }

      const fcmToken = await this.getFCMToken();

      if (isString(fcmToken, true)) chatService.connect(authService.getToken(), fcmToken);
    } else {
      FCMClient.clearNotification();
      FCMClient.cancelNotification();

      listeners.forEach(listener => listener.remove());
      listeners.clear();

      chatService.clear();

      this.deleteFCMInstance();
    }
  };

  onToken = (fcmToken) => {
    chatService.close();
    chatService.connect(authService.getToken(), fcmToken);
  };

  onNotification = (notification) => {
    const { opened_from_tray: isOpenedFromTray = false, finish } = notification;
    console.log("==========notification1==========", notification)
    let appData
    try {
      appData = JSON.parse(notification.app);
      console.log("==========notification2==========", notification)
    } catch (error) {
      console.log(error);
    }
    if (typeof finish === 'function') finish();

    if (isOpenedFromTray) {
      handleInitialNotification = false;
      this.tapOnNotificationView(appData.uid, appData.name);

    } else {
      console.log("==========notification3==========", notification)
      this.setState({
        notification: notification
      }, () => {
        setTimeout(() => {
          this.setState({ notification: null });
        }, 2000);
      });
    }
  };

  getFCMToken = async () => {
    try {
      return await FCM.getFCMToken();
    } catch (e) {
      return '';
    }
  };

  getInitialNotification = async () => {
    const notification = await FCM.getInitialNotification();
    const { id, opened_from_tray: isOpenedFromTray = false } = notification;

    console.log("====notification=====", notification)

    if (isOpenedFromTray && id != null) {
      this.onNotification(notification);
    }
  };

  deleteFCMInstance = async () => {
    try {
      await FCM.deleteInstanceId();

      return true;
    } catch (e) {
      return false;
    }
  };

  requestPermissions = async () => {
    try {
      await FCM.requestPermissions();

      return true;
    } catch (e) {
      return false;
    }
  };

  tapOnNotificationView = (uid, name) => {

    this.setState({ notification: null }, () => {
      navigationDispatcher.dispatch(NavigationActions.navigate({
        routeName: 'Messenger',
        action: NavigationActions.navigate({
          routeName: 'Chat',
          params: {
            uid: uid,
            name: name,
            openedFromNotification: true,
            markAsRead: true
          }
        })
      }));
    });
  };


  render() {
    const { notification } = this.state;
    return null;
    if (notification == null) {
      return null;
    } else {

      const notificationData = JSON.parse(notification.custom_notification);
      const appData = JSON.parse(notification.app);

      console.log("notification data:", notificationData);
      console.log("app data:", appData);

      return <RNModal
        transparent={true}
        visible={true}>
        < View style={{ backgroundColor: palette[0] }}>
          <TouchableOpacity onPress={() => this.tapOnNotificationView(appData.uid, appData.name)}>
            <Text style={styles.title}>{notificationData.title}</Text>
            <Text style={styles.message}> {notificationData.body}</Text>
          </TouchableOpacity>
        </View >
      </RNModal >

    }
  }
}

const styles = StyleSheet.create({
  title: {
    paddingLeft: 8,
    paddingRight: 5,
    paddingTop: 30,
    color: palette[2],
    fontSize: 19,
    textAlign: 'left'
  },
  message: {
    padding: 5,
    color: palette[1],
    fontSize: 14,
    textAlign: 'left'
  }
});


export default FCMClient;

// render() {
//   const { notification } = this.state;

//   if (notification == null) {
//     return null;
//   } else {

//     const notificationData = JSON.parse(notification.custom_notification);
//     const appData = JSON.parse(notification.app);

//     var date = new Date();
//     var hour = date.getHours();
//     var min = date.getMinutes();
//     var sec = date.getSeconds();
//     var curTime = hour + ":" + min + ":" + sec;

    //  return <Modal
    //   transparent={true}
    //   visible={true}>
    //   < View style={{ backgroundColor: palette[0] }}>
    //     <TouchableOpacity onPress={() => this.tapOnNotificationView(appData.uid, appData.name)}>
    //       <View style={styles.titleView}>
    //         <Text style={styles.title}>{notificationData.title}</Text>
    //         <Text style={styles.time}>{curTime}</Text>
    //       </View>
    //       <Text style={styles.message}> {notificationData.body}</Text>
    //     </TouchableOpacity>
    //   </View >
    // </Modal >

//   }
// }
// }

// const styles = StyleSheet.create({
// titleView: {
//   flexDirection: 'row',
//   width: '100%',
//   justifyContent: 'space-between'
// },
// title: {
//   paddingLeft: 8,
//   paddingRight: 5,  
//   paddingTop: 0,
//   color: palette[2],
//   fontSize: 19,
//   textAlign: 'left'
// },
// time: {
//   paddingRight: 10,
//   color: palette[1],
//   paddingTop: 0,
//   fontSize: 12,
//   textAlign: 'right'
// },
// message: {
//   padding: 5,
//   color: palette[1],
//   fontSize: 14,
//   textAlign: 'left'
// }
// });


// export default FCMClient;
