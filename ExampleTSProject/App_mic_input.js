/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { Component } from 'react';
import {
  Button,
  PermissionsAndroid,
  Pressable,
  SafeAreaView,
  Text,
} from 'react-native';
import 'react-native-get-random-values';
import 'node-libs-react-native/globals';
import { AudioConfig, AudioInputStream, AudioStreamFormat, CancellationDetails, CancellationReason, NoMatchDetails, NoMatchReason, ResultReason, SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import { LogBox } from 'react-native';
import AudioRecord from 'react-native-live-audio-stream';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

export default App = () => {
  const channels = 1;
  const bitsPerChannel = 16;
  const sampleRate = 16000;
  const key = "YOUR_SUBSCRIPTION_KEY";
  const region = "YOUR_SUBSCRIPTION_REGION";

  let initializedCorrectly = false;
  let recognizer;
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external storage', grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  const initializeAudio = async () => {
    await checkPermissions(); // check app permissions 
    if(!initializedCorrectly) {

      const pushStream = AudioInputStream.createPushStream();
      const options = {
        sampleRate,
        channels,
        bitsPerChannel,
        audioSource: 6,
      };

      AudioRecord.init(options);
      AudioRecord.on('data', (data) => {
        const pcmData = Buffer.from(data, 'base64');
        pushStream.write(pcmData);
      });

      AudioRecord.start();

      const speechConfig = SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = "en-US";
      const audioConfig = AudioConfig.fromStreamInput(pushStream);
      recognizer = new SpeechRecognizer(speechConfig, audioConfig);

      recognizer.sessionStarted = (s, e) => {
        console.log("sessionStarted");
        console.log(e.sessionId);
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log("sessionStopped");
      };

      recognizer.recognizing = (s, e) => {
        console.log(`RECOGNIZING: Text=${e.result.text}`);
        console.log(e.result.text);
        console.log(e.sessionId);
      };
      recognizer.recognized = (s, e) => {
        console.log(`RECOGNIZED: Text=${e.result.text}`);
        console.log(e.result);
      };
      recognizer.startContinuousRecognitionAsync(() => {
          console.log("startContinuousRecognitionAsync");
      },
      (err) => {
        console.log(err);
      });

      initializedCorrectly = true;
    }
  };

  const stopAudio = async () => {
    AudioRecord.stop(); 
    if(!!recognizer) {
      recognizer.stopContinuousRecognitionAsync();
      initializedCorrectly = false;
    }
  };

  return <SafeAreaView style={{flexGrow: 1, justifyContent: "center", alignItems: "center"}}>
    
    <Pressable style={{padding: 15, backgroundColor: "white", borderRadius: 15}} onPress={
      () => {
        console.log("Listening");
        initializeAudio();
      }}>
      <Text style={{color: "black"}}>Micstream start</Text>
    </Pressable>
      <Pressable style={{padding: 15, backgroundColor: "white", borderRadius: 15}} onPress={
      () => {
        console.log("Stopping");
        stopAudio();
      }}>
      <Text style={{color: "black"}}>Micstream stop</Text>
      </Pressable>
  </SafeAreaView>;
};