/** @module src/chat/DialogsScreen */

import React, { Component } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  BackHandler
} from 'react-native';
import Toast from '@remobile/react-native-toast';
import Appsee from 'react-native-appsee';


import { markRouteAsActive } from '../AppNavigator';
import { getStateParam } from '../common/helpers';
import { placeholders } from '../common/styles';
import chatService from './chatService';
import Dialog from './Dialog';
import DialogsScreenHeader from './DialogsScreenHeader';
import modes from './dialogsScreenModes';
import styles from './DialogsScreen.styles';

/**
 * Screen component for dialogs list.
 * @extends Component
 */
class DialogsScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    header: <DialogsScreenHeader navigation={navigation} />
  })

  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isProcessing: false,
      isRefreshing: false,
      mode: modes.default,
      dialogs: [],
      selection: [],
      offset: 0
    };
  }

  componentDidMount() {
    Appsee.addEvent('Reached DialogsScreen');
    const { navigation } = this.props;

    if (getStateParam(navigation, 'loadDialogs', false)) {
      chatService.addEventListener(chatService.onConnect, this.onConnect);
      chatService.addEventListener(chatService.onReceive, this.onReceive);
      chatService.addEventListener(chatService.onError, this.onError);
      chatService.addEventListener(chatService.onClose, this.onClose);
    }

    BackHandler.addEventListener('hardwareBackPress', () => {
      this.props.navigation.navigate('Market');

      markRouteAsActive('Market');

      return true;
    });
  }

  componentWillReceiveProps(nextProps) {
    const mode = getStateParam(nextProps.navigation, 'mode', modes.default);

    if (mode !== this.state.mode) this.switchMode(mode);
  }

  componentWillUnmount() {
    chatService.removeEventListener(chatService.onConnect, this.onConnect);
    chatService.removeEventListener(chatService.onReceive, this.onReceive);
    chatService.removeEventListener(chatService.onError, this.onError);
    chatService.removeEventListener(chatService.onClose, this.onClose);

    BackHandler.removeEventListener('hardwareBackPress');
  }

  onConnect = () => {
    this.loadDialogs();
  };

  onReceive = (evt) => {
    try {

      const data = JSON.parse(evt.data);
      switch (data.type) {
        case 'dialogs':
          this.onDialogsLoad(data.info);
          break;
        case 'message':
          this.onMessage(data);
          break;
        case 'success':
          if (/^DEL/.test(data.id)) this.onDialogsDelete();
          break;
        default:
          break;
      }
    } catch (e) {
      Toast.show('Serverfeil', 2000);
    } finally {
      this.resetIndicators();
    }
  };

  onClose = () => {
    // Toast.show('Nettverksfeil', 2000);
    this.resetIndicators();
  };

  onError = () => {
    // Toast.show('Nettverksfeil', 2000);
    this.resetIndicators();
  }

  onDialogsLoad = (dialogs) => {
    this.setState({ dialogs: (this.state.offset ? [...this.state.dialogs, ...dialogs] : dialogs) });
  };

  onDialogsDelete = () => {
    this.setState({
      dialogs: this.state.dialogs.filter(dialog => this.state.selection.indexOf(dialog.uid) < 0),
      selection: []
    }, () => {
      this.props.navigation.setParams({ mode: modes.default });
    });
  };

  onMessage = (message) => {
    const { dialogs } = this.state;

    this.setState({
      dialogs: [
        {
          ...(dialogs.find(dialog => dialog.uid === message.uid)),
          ...{
            uid: message.uid,
            name: message.name,
            message: message.text,
            isOwn: false,
            isRead: false
          }
        },
        ...(dialogs.filter(dialog => dialog.uid !== message.uid))
      ]
    });
  };

  onEndReached = () => {
    if (this.state.isLoading) return;

    this.loadDialogs(this.state.dialogs.length);
  };

  onDialogSelect = (dialog, selected) => {
    const selection = [...this.state.selection];

    if (selected) {
      selection.push(dialog.uid);
    } else {
      selection.splice(selection.indexOf(dialog.uid), 1);
    }

    this.setState({ selection }, () => {
      this.props.navigation.setParams({ mode: modes.select, selected: selection.length });
    });
  };

  loadDialogs = (offset = 0, process = { isLoading: true }) => {
    this.setState({ offset, ...process }, () => {
      chatService.send({ type: 'dialogs', offset: this.state.offset, limit: 30 });
    });
  };

  refreshDialogs = () => {
    this.setState({
      dialogs: []
    }, this.loadDialogs(0, { isRefreshing: true }));
  };

  deleteDialogs = () => {
    this.setState({ isProcessing: true });

    chatService.send({
      type: 'delete',
      id: `DEL-${this.state.selection.join(';')}`,
      uids: this.state.selection
    });
  };

  navToDialog = (dialog) => {
    const { uid, name, isOwn, isRead } = dialog;

    this.props.navigation.navigate('Chat', {
      uid,
      name,
      goBack: true,
      markAsRead: !isOwn && !isRead,
      onGoBack: this.refreshDialogs
    });
  };

  resetIndicators = () => {
    this.setState({ isLoading: false, isProcessing: false, isRefreshing: false });
    this.props.navigation.setParams({ mode: modes.default });
  };

  switchMode = (mode) => {
    switch (mode) {
      case modes.default:
        this.setState({ mode, selection: [], isProcessing: false });

        break;
      case modes.delete:
        if (this.state.selection.length) {
          this.setState({ mode }, this.deleteDialogs);
        }

        break;
      default:
        this.setState({ mode });

        break;
    }
  };

  keyExtractor = dialog => dialog.uid;

  renderDialog = ({ item }) => {
    const { mode, selection } = this.state;

    return (
      <Dialog
        dialog={item}
        mode={mode}
        selected={selection.indexOf(item.uid) > -1}
        onSelect={this.onDialogSelect}
        onPress={this.navToDialog}
      />
    );
  };

  render() {
    const { dialogs, isLoading, isProcessing, isRefreshing, mode } = this.state;

    return (
      <View style={styles.container}>
        {isProcessing && (
          <ActivityIndicator animate size="large" style={styles.processingIndicator} />
        )}
        <SectionList
          sections={dialogs.length ? [{ data: dialogs }] : []}
          keyExtractor={this.keyExtractor}
          extraData={mode}
          renderItem={this.renderDialog}
          ListEmptyComponent={(isLoading || isProcessing || isRefreshing) ? null : (
            <Text style={placeholders.emptyComponentText}>Trekk for å oppdatere</Text>
          )}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={this.refreshDialogs} />}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0.01}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          scrollEventThrottle={16}
          initialNumToRender={50}
          maxToRenderPerBatch={50}
          windowSize={50}
          removeClippedSubviews
        />
        <View style={styles.loadingIndicator}>
          {isLoading && <ActivityIndicator animate size="large" />}
        </View>
      </View>
    );
  }
}

export default DialogsScreen;
