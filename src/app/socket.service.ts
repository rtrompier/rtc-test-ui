import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
    public socket;
    public clients: string[];

    private connection = new RTCPeerConnection();

    constructor() {
        // this.socket = io('http://rtc.remy-trompier.ch:4000');
    }

    public init() {
        this.socket = io('http://localhost:4000');

        this.socket.on('connect', this.connectHandler.bind(this));

        this.socket.on('updateUserList', this.updateUserListHandler.bind(this));

        this.socket.on('callMade', this.callMadeHandler.bind(this));

        this.socket.on('addUser', (socketId) => {
            console.log('addUser');
            this.clients = this.clients.filter((cl) => cl !== socketId); // Remove user if already exist
            this.clients.push(socketId);

            this.createOffer();
        });

        this.socket.on('removeUser', (socketId) => {
            console.log('removeUser');
            this.clients = this.clients.filter((cl) => cl !== socketId); // remove user
        });

        this.socket.on('answerMade', (data) => {
            console.log('answerMade');
            this.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
        });



        this.connection.ontrack = this.onTrackHandler.bind(this);
    }

    public addStream(track: MediaStreamTrack, stream: MediaStream) {
        this.connection.addTrack(track, stream);
    }

    public async createOffer() {
        const offer = await this.connection.createOffer();
        this.connection.setLocalDescription(offer);
        // Push to remote user
        if (this.clients) {
            console.log('Call callUser');
            this.socket.emit('callUser', {
                offer,
                to: this.clients[0],
            });
        }
    }

    private connectHandler(e) {
        console.log('connect', e);
    }

    private updateUserListHandler(clients: string[]) {
        console.log('updateUserList', clients);
        this.clients = clients;

        this.createOffer();
    }

    private endCall() {
        const videos = document.getElementsByTagName('video');
        for (let i = 0; i < videos.length; i++) {
            videos[i].pause();
        }

        this.connection.close();
    }

    private error(err) {
        this.endCall();
    }

    private async callMadeHandler(data) {
        console.log('call made', data);
        await this.connection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(new RTCSessionDescription(answer));
        this.socket.emit('makeAnswer', {answer, to: data.socket});
    }

    private onTrackHandler(event: RTCTrackEvent) {
        const vid = document.createElement('video');
        vid.setAttribute('autoplay', 'true');
        vid.setAttribute('playsinline', 'true');
        vid.srcObject = event.streams[0];
        document.getElementsByTagName('body')[0].appendChild(vid);
    }

}
