import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
    public socket;
    private candidateConnection: RTCPeerConnection;
    private peerConnections = {};


    private myVideo: HTMLVideoElement;
    private candidateVideo: HTMLVideoElement;

    constructor() {
        // this.socket = io('http://rtc.remy-trompier.ch:4000');
    }

    public init(myVideo: HTMLVideoElement, candidateVideo: HTMLVideoElement) {
        this.socket = io('http://localhost:4000');
        this.socket.on('answer', this.answerHandler.bind(this));
        this.socket.on('watcher', this.watcherHandler.bind(this));
        this.socket.on('offer', this.offerHandler.bind(this));
        this.socket.on('connect', this.connectHandler.bind(this));
        this.socket.on('broadcaster', this.connectHandler.bind(this));

        this.myVideo = myVideo;
        this.candidateVideo = candidateVideo;
    }

    private answerHandler(id, description) {
        this.peerConnections[id].setRemoteDescription(description);
    }

    private watcherHandler(id, description) {
        const peerConnection = new RTCPeerConnection();
        this.peerConnections[id] = peerConnection;
        const stream = this.myVideo.srcObject as MediaStream;
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
    }

    private offerHandler(id, description) {
        this.candidateConnection = new RTCPeerConnection();
        this.candidateConnection.setRemoteDescription(description)
            .then(() => this.candidateConnection.createAnswer())
            .then(sdp => this.candidateConnection.setLocalDescription(sdp))
            .then(() => {
                this.socket.emit('answer', id, this.candidateConnection.localDescription);
            });
        this.candidateConnection.ontrack = (event) => {
            this.candidateVideo.srcObject = event.streams[0];
        };
        this.candidateConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('candidate', id, event.candidate);
            }
        };
    }

    private connectHandler() {
        this.socket.emit('watcher');
    }



}
