import {useEffect, useState} from 'react';
import {type Handler, type Payload} from './use-channel-handlers';

export default function useBroadcastChannel({
  channelId,
  onIncoming,
}: {
  channelId: string;
  onIncoming?: Handler;
}): Handler {
  const [postMessage, setPostMessage] = useState<() => void>(
    () => () => undefined,
  );

  useEffect(() => {
    const channel = new BroadcastChannel(channelId);
    let channelOpen = true;
    const channelMessageHandler = (event: MessageEvent) => {
      console.log('incoming bc', channelId, event);
      if (onIncoming) {
        onIncoming(event.data as Payload);
      }
    };

    channel.addEventListener('message', channelMessageHandler);
    setPostMessage(() => (payload: any) => {
      console.log('posting bc data', channelId, payload);
      if (channelOpen) {
        channel.postMessage(payload);
      }
    });

    return () => {
      channelOpen = false;
      channel.removeEventListener('message', channelMessageHandler);
      channel.close();
    };
  }, [onIncoming, channelId]);

  return postMessage;
}
