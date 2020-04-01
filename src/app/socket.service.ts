import { Injectable, OnInit } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({providedIn: 'root'})
export class SocketService {
  public peerConnections = [];
  // public socket = io('http://rtc.remy-trompier.ch:4000');
  public socket = io('http://mac-0522.huge.ad.hcuge.ch:4000');

  public videoStreams = new Map<string, MediaStream>();

  constructor() {}


  public initConnection() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      this.videoStreams.set('broadcaster', stream);
      this.socket.emit('broadcaster');
    }).catch(error => console.error(error));

    this.socket.on('answer', (id, description) => {
      this.peerConnections[id].setRemoteDescription(description);
    });

    this.socket.on('watcher', (id) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{
          urls: ['stun:stun.l.google.com:19302']
        }]
      });
      this.peerConnections[id] = peerConnection;
      const stream = this.videoStreams.get('broadcaster');
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.createOffer()
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
        this.socket.emit('offer', id, peerConnection.localDescription);
      });
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('candidate', id, event.candidate);
        }
      };
    });

    this.socket.on('offer', (id, description) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{
          urls: ['stun:stun.l.google.com:19302']
        }]
      });
      peerConnection.setRemoteDescription(description)
      .then(() => peerConnection.createAnswer())
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
        this.socket.emit('answer', id, peerConnection.localDescription);
      });
      peerConnection.ontrack = (event) => {
        this.videoStreams.set(id, event.streams[0]);
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('candidate', id, event.candidate);
        }
      };
    });

    this.socket.on('connect', () => {
      this.socket.emit('watcher');
    });

    this.socket.on('broadcaster', () => {
      this.socket.emit('watcher');
    });

    // this.socket.on('candidate', (id, candidate) => {
    //   this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    // });

    this.socket.on('bye', (id) => {
      if (this.peerConnections[id]) { this.peerConnections[id].close(); }
      delete this.peerConnections[id];
    });
  }

}
