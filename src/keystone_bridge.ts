import { KeystoneWebUSBBridge } from "@keystonehq/metamask-keystone-webusb-bridge";

export enum KeystoneEvent {
  IFRAME_READY = "keystone-iframe-ready",
  INIT = "keystone-bridge-init",
  GET_KEYS = "keystone-bridge-get-keys",
  SIGN_TRANSACTION = "keystone-bridge-sign-transaction",
  SIGN_PERSONAL_MESSAGE = "keystone-bridge-sign-personal-message",
  SIGN_EIP712_MESSAGE = "keystone-bridge-sign-eip712-message",
}

export const KEYSTONE_IFRAME_TARGET = "KEYSTONE-IFRAME";

export class KeystoneBridge {
  private bridge: KeystoneWebUSBBridge | null = null;
  private isInitialized = false;
  
  constructor() {
    this.addEventListener();
  }

  addEventListener() {
    window.addEventListener("message", async (event) => {
      if (event && event.data && event.data.target === KEYSTONE_IFRAME_TARGET) {
        const { action, params, messageId } = event.data;
        const replyAction = `${action}-reply`;
        try {
          switch (action) {
            case KeystoneEvent.IFRAME_READY:
              this.sendMessageToExtension({
                action: replyAction,
                success: true,
                messageId,
              });
              break;
            case KeystoneEvent.INIT:
              await this.bridgeInit(replyAction, messageId);
              break;
            case KeystoneEvent.GET_KEYS:
              await this.getKeys(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_TRANSACTION:
              await this.signTransaction(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_PERSONAL_MESSAGE:
              await this.signPersonalMessage(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_EIP712_MESSAGE:
              await this.signEIP712Message(params, replyAction, messageId);
              break;
          }
        } catch (error: any) {
          this.sendMessageToExtension({
            action: replyAction,
            success: false,
            messageId,
            error: error.message,
          });
        }
      }
    });
  }

  async bridgeInit(replyAction: string, messageId: string) {
    try {
      if (!this.isInitialized) {
        this.bridge = new KeystoneWebUSBBridge();
        await this.bridge.init();
        this.isInitialized = true;
        console.log("Keystone WebUSB bridge initialized successfully");
      }
      
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        messageId,
      });
    } catch (error: any) {
      console.error("Failed to initialize Keystone bridge:", error);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        messageId,
        error: error.message,
      });
    }
  }

  async getKeys(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error("Bridge not initialized. Please call init first.");
    }
    
    const { paths } = params;
    const keys = await this.bridge.getKeys(paths);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: keys,
      messageId,
    });
  }

  async signTransaction(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error("Bridge not initialized. Please call init first.");
    }
    
    const { path, rawTx, isLegacyTx } = params;
    const signature = await this.bridge.signTransaction(path, rawTx, isLegacyTx);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  async signPersonalMessage(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error("Bridge not initialized. Please call init first.");
    }
    
    const { path, message } = params;
    const signature = await this.bridge.signPersonalMessage(path, message);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  async signEIP712Message(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error("Bridge not initialized. Please call init first.");
    }
    
    const { path, jsonMessage } = params;
    const signature = await this.bridge.signEIP712Message(path, jsonMessage);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  sendMessageToExtension(msg: any) {
    window.parent.postMessage(msg, "*");
  }
}
