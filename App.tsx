import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAppController } from './src/hooks/useAppController';
import { MessageOverlay } from './src/components/MessageOverlay';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [zoom, setZoom] = useState(0);
  const [maxRes, setMaxRes] = useState("");
  const [focusMode, setFocusMode] = useState<"on" | "off">("on");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const { status, connect } = useAppController({
    cameraRef,
    onError: showMessage,
    onZoom: setZoom,
    onTriggerFocus: () => {
      setFocusMode("off");
      setTimeout(() => setFocusMode("on"), 100);
    }
  });

  const onCameraReady = async () => {
    if (cameraRef.current) {
      const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
      if (sizes?.length) {
        const sorted = sizes.sort((a: string, b: string) => {
          const [wA, hA] = a.split('x').map(Number);
          const [wB, hB] = b.split('x').map(Number);
          return (wB * hB) - (wA * hA);
        });
        setMaxRes(sorted[0]);
      }
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    connect(data);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission}><Text style={styles.text}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        zoom={zoom}
        autofocus={focusMode}
        pictureSize={maxRes}
        onCameraReady={onCameraReady}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setIsScanning(!isScanning)}>
          <Ionicons name="scan" size={28} color={isScanning ? "#00FF00" : "#FFFFFF"} />
        </TouchableOpacity>
        <View style={[styles.dot, { backgroundColor: status }]} />
      </View>

      {message !== '' && <MessageOverlay message={message} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#FFF', fontSize: 16 },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: { padding: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 }
});