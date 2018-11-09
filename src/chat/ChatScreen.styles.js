/** @module src/chat/ChatScreen.styles */

import { StyleSheet } from 'react-native';

import { palette } from '../common/styles';

/**
 * Stylesheet for ChatScreen.
 * @type {StyleSheet}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingIndicator: {
    backgroundColor: palette[4],
    left: 0,
    justifyContent: 'center',
    padding: 15,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1
  },
  chat: {
    backgroundColor: palette[4],
    flex: 1
  },
  sectionDate: {
    alignSelf: 'center',
    backgroundColor: palette[1],
    borderRadius: 50,
    color: palette[0],
    marginBottom: 10,
    opacity: 0.35,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  sectionDateSticky: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 11
  },
  controls: {
    alignItems: 'center',
    backgroundColor: palette[0],
    elevation: 10,
    flexDirection: 'row',
    maxHeight: '100%',
    padding: 5,
    width: '100%'
  },
  sendButton: {
    backgroundColor: palette[2],
    borderRadius: 50,
    marginLeft: 10,
    padding: 10
  },
  scrollContainer: {
    paddingTop: 5
  },
});

export default styles;

