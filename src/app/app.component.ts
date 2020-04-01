import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    private peerConnections = [];
    public peerConnection: any;

    public id: string;

    @ViewChild('myVideo') public myVideo: ElementRef;

    constructor(private socketService: SocketService) {
        window.onunload = window.onbeforeunload = () => {
            this.socketService.socket.close();
        };
    }

    public ngOnInit() {
        this.id = this.uuidv4();

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        })
            .then((stream) => {
                this.myVideo.nativeElement.srcObject = stream;

                // Pass video element to service
                this.socketService.init();

                // Add all track inside the connection
                stream.getTracks().forEach((track) => this.socketService.addStream(track, stream));

                // Create offer and send to remote user
                this.socketService.createOffer();
            }).catch(error => console.error(error));


        // this.socketService.socket.on('candidate', (id, candidate) => {
        //   this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
        // });

        // this.socketService.socket.on('bye', (id) => {
        //   if (this.peerConnections[id]) { this.peerConnections[id].close(); }
        //   delete this.peerConnections[id];
        // });
    }


    private uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

}
