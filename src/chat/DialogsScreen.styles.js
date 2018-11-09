/** @module src/chat/DialogsScreen.styles */

import { StyleSheet } from 'react-native';

import { palette } from '../common/styles';

/**
 * Stylesheet for DialogsScreen.
 * @type {StyleSheet}
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: palette[0],
    flex: 1
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 15
  },
  processingIndicator: {
    ...(StyleSheet.flatten(StyleSheet.absoluteFillObject)),
    backgroundColor: `${palette[0]}50`,
    justifyContent: 'flex-start',
    padding: 15,
    zIndex: 1
  }
});

export default styles;

