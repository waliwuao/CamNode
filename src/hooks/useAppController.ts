import { useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

interface ControllerProps {
  cameraRef: React.RefObject<any>;
  onError: (msg: string) => void;
  onZoom: (val: number) => void;
  onTriggerFocus: () => void;
}

export function useAppController({ cameraRef, onError, onZoom, onTriggerFocus }: ControllerProps) {
  const [status, setStatus] = useState<"red" | "yellow" | "green">("red");
  const socketRef = useRef<Socket | null>(null);
  const serverUrlRef = useRef<string>("");

  const uploadPhoto = async (uri: string, url: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `camnode_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      await fetch(`${url}/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch (e) {
      onError("Upload Failed");
    }
  };

  const handleCommand = async (data: any) => {
    try {
      if (data.type === 'SET_ZOOM') {
        onZoom(parseFloat(data.value));
      } else if (data.type === 'AUTO_FOCUS') {
        onTriggerFocus();
      } else if (data.type === 'TAKE_PHOTO') {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: false,
        });
        if (photo && serverUrlRef.current) {
          uploadPhoto(photo.uri, serverUrlRef.current);
        }
      }
    } catch (err) {
      onError("Command Error");
    }
  };

  const connect = (url: string) => {
    if (socketRef.current) socketRef.current.disconnect();
    serverUrlRef.current = url;
    setStatus("yellow");
    const socket = io(url, { transports: ['websocket'] });

    socket.on('connect', () => setStatus("green"));
    socket.on('disconnect', () => { setStatus("red"); onError("Disconnected"); });
    socket.on('connect_error', () => { setStatus("red"); onError("Connection Error"); });
    socket.on('control', handleCommand);
    socketRef.current = socket;
  };

  useEffect(() => {
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  return { status, connect };
}