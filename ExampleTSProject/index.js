/**
 * @format
 */

// How to run continuous recognition?
// 1. Change the line from "import App from './App';" to "import App from './App_mic_input';"
// * If you want to use continuous recognition with live translation change the line to "import App from './App_mic_input_translated';"
// 2. Run


import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
