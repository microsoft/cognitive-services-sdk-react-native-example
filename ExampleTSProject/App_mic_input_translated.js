/**

This sample app allows continuous voice recognition using microsoft-cognitiveservices-speech-sdk and react-native-live-audio-stream.

How to run this?
1. Change values needed at line 26 "//CHANGE THESE VALUES"
2. Check the header in index.js for futher instructions

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
import { AudioConfig, AudioInputStream, AudioStreamFormat, CancellationDetails, CancellationReason, NoMatchDetails, NoMatchReason, ResultReason, SpeechConfig, SpeechRecognizer, SpeechTranslationConfig, TranslationRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import { LogBox } from 'react-native';
import AudioRecord from 'react-native-live-audio-stream';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

export default App = () => {
  //CHANGE THESE VALUES
  const key = "YOUR_SUBSCRIPTION_KEY";
  const region = "YOUR_SUBSCRIPTION_REGION";
  const language = "es-ES";
  const targetLanguage = "en";



  //Settings for the audio stream
  //tuned to documentation at https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-use-audio-input-streams
  //Do not change these values unless you're an expert
  const channels = 1;
  const bitsPerChannel = 16;
  const sampleRate = 16000;

  let initializedCorrectly = false;
  let recognizer;

  //prompt for permissions if not granted
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

  //sets up speechrecognizer and audio stream
  const initializeAudio = async () => {
    await checkPermissions();
    if(!initializedCorrectly) {

      //creates a push stream system which allows new data to be pushed to the recognizer
      const pushStream = AudioInputStream.createPushStream();
      const options = {
        sampleRate,
        channels,
        bitsPerChannel,
        audioSource: 6,
      };

      AudioRecord.init(options);
      //everytime data is recieved from the mic, push it to the pushStream
      AudioRecord.on('data', (data) => {
        const pcmData = Buffer.from(data, 'base64');
        pushStream.write(pcmData);
      });

      AudioRecord.start();

      const speechTranslationConfig = SpeechTranslationConfig.fromSubscription(key, region);
      speechTranslationConfig.speechRecognitionLanguage = language;
      speechTranslationConfig.addTargetLanguage(targetLanguage);
      const audioConfig = AudioConfig.fromStreamInput(pushStream); //the recognizer uses the stream to get audio data
      recognizer = new TranslationRecognizer(speechTranslationConfig, audioConfig);

      recognizer.sessionStarted = (s, e) => {
        console.log("sessionStarted");
        console.log(e.sessionId);
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log("sessionStopped");
      };

      recognizer.recognizing = (s, e) => {
        //The recognizer will return partial results. This is not called when recognition is stopped and sentences are formed but when recognizer picks up scraps of words on-the-fly.
        console.log(`RECOGNIZING: Text=${e.result.text}`);
        console.log(`RECOGNIZING: Text=${e.result.translations.get(targetLanguage)}`);
        console.log(e.result.text);
        console.log(e.sessionId);
      };
      recognizer.recognized = (s, e) => {
        //The final result of the recognition with punctuation
        console.log(`RECOGNIZED: Text=${e.result.text}`);
        console.log(`RECOGNIZING: Text=${e.result.translations.get(targetLanguage)}`);
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

  //stops the audio stream and recognizer
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